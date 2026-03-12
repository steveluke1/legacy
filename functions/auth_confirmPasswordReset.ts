import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { crypto } from 'https://deno.land/std@0.224.0/crypto/mod.ts';
import { encodeHex } from 'https://deno.land/std@0.224.0/encoding/hex.ts';
import { getClientIp, hashIp, rateLimitCheck } from './securityHelpers.js';

// Hash password with PBKDF2 (same as auth_register)
async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  
  return encodeHex(new Uint8Array(hashBuffer));
}

// Generate random salt
function generateSalt() {
  return encodeHex(crypto.getRandomValues(new Uint8Array(16)));
}

// Hash with pepper (SHA-256)
async function hashWithPepper(value) {
  const pepper = Deno.env.get('AUTH_HASH_PEPPER');
  if (!pepper) {
    throw new Error('AUTH_HASH_PEPPER not configured');
  }
  
  const encoder = new TextEncoder();
  const data = encoder.encode(pepper + ':' + value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Validate password policy (same as auth_register)
function validatePassword(password) {
  if (!password || password.length < 10) {
    return { valid: false, error: 'A senha deve ter pelo menos 10 caracteres' };
  }
  
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumberOrSymbol = /[0-9!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!hasUppercase || !hasLowercase || !hasNumberOrSymbol) {
    return { 
      valid: false, 
      error: 'Senha inválida. Ela deve ter letras maiúsculas, minúsculas e número ou símbolo.' 
    };
  }
  
  return { valid: true };
}

Deno.serve(async (req) => {
  const correlationId = crypto.randomUUID();
  
  try {
    console.log(`[auth_confirmPasswordReset:${correlationId}] START`);
    
    const base44 = createClientFromRequest(req);
    
    // Rate limiting (IP-based: 10 req/min)
    const clientIp = getClientIp(req);
    const ipHash = await hashIp(clientIp);
    const bucketKeyIp = `pwd_confirm_ip:${ipHash}`;
    
    const rateLimitIp = await rateLimitCheck(base44.asServiceRole, bucketKeyIp, 10, 60, 900);
    
    if (!rateLimitIp.allowed) {
      console.warn(`[auth_confirmPasswordReset:${correlationId}] RATE_LIMIT_IP ipHash=${ipHash.substring(0, 8)}***`);
      return Response.json({ 
        success: false,
        error: 'Muitas tentativas. Tente novamente em alguns minutos.'
      }, { status: 429 });
    }
    
    const body = await req.json();
    const { email, code, new_password } = body;

    // Validation
    if (!email || !code || !new_password) {
      return Response.json({ 
        success: false,
        error: 'Todos os campos são obrigatórios' 
      }, { status: 400 });
    }

    // Normalize
    const normalizedEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    // Validate password policy
    const passwordValidation = validatePassword(new_password);
    if (!passwordValidation.valid) {
      return Response.json({ 
        success: false,
        error: passwordValidation.error 
      }, { status: 400 });
    }

    // Rate limiting (email-based: 5/min + 20/hour)
    const emailHashPeppered = await hashWithPepper(normalizedEmail);
    const bucketKeyEmailMin = `pwd_confirm_email_min:${emailHashPeppered}`;
    const bucketKeyEmailHour = `pwd_confirm_email_hour:${emailHashPeppered}`;
    
    const rateLimitEmailMin = await rateLimitCheck(base44.asServiceRole, bucketKeyEmailMin, 5, 60, 900);
    const rateLimitEmailHour = await rateLimitCheck(base44.asServiceRole, bucketKeyEmailHour, 20, 3600, 3600);
    
    if (!rateLimitEmailMin.allowed || !rateLimitEmailHour.allowed) {
      console.warn(`[auth_confirmPasswordReset:${correlationId}] RATE_LIMIT_EMAIL emailHash=${emailHashPeppered.substring(0, 8)}***`);
      return Response.json({ 
        success: false,
        error: 'Muitas tentativas. Tente novamente em alguns minutos.'
      }, { status: 429 });
    }

    // Hash the provided code with pepper
    const providedCodeHashPeppered = await hashWithPepper(cleanCode);

    // Find valid tokens for this email
    const tokens = await base44.asServiceRole.entities.PasswordResetToken.filter({
      email: normalizedEmail,
      used: false
    }, '-created_date', 10);

    // Filter to non-expired, not locked, matching code_hash
    const now = new Date();
    const validTokens = tokens.filter(t => {
      const expiresAt = new Date(t.expires_at);
      const isExpired = expiresAt <= now;
      
      // Check if locked
      if (t.locked_until) {
        const lockedUntil = new Date(t.locked_until);
        if (lockedUntil > now) {
          return false; // Still locked
        }
      }
      
      return !isExpired && t.code_hash === providedCodeHashPeppered;
    });

    if (validTokens.length === 0) {
      console.log(`[auth_confirmPasswordReset:${correlationId}] INVALID_TOKEN`);
      
      // Try to increment attempts on any matching email token (brute-force tracking)
      const emailTokens = tokens.filter(t => {
        const expiresAt = new Date(t.expires_at);
        return expiresAt > now && !t.used;
      });
      
      if (emailTokens.length > 0) {
        const targetToken = emailTokens[0];
        const newAttempts = (targetToken.attempts || 0) + 1;
        const updateData = { attempts: newAttempts };
        
        if (newAttempts >= 5) {
          // Lock for 20 minutes after 5 failed attempts
          const lockUntil = new Date(Date.now() + 20 * 60 * 1000);
          updateData.locked_until = lockUntil.toISOString();
          console.warn(`[auth_confirmPasswordReset:${correlationId}] TOKEN_LOCKED token_id=${targetToken.id} attempts=${newAttempts}`);
        }
        
        await base44.asServiceRole.entities.PasswordResetToken.update(targetToken.id, updateData);
      }
      
      // Generic error (anti-enumeration)
      return Response.json({ 
        success: false,
        error: 'Código inválido ou expirado. Solicite um novo código.' 
      }, { status: 400 });
    }

    const token = validTokens[0];
    console.log(`[auth_confirmPasswordReset:${correlationId}] TOKEN_VALID token_id=${token.id} user_id=${token.user_id}`);

    // Get user
    const users = await base44.asServiceRole.entities.AuthUser.filter({
      id: token.user_id
    }, undefined, 1);

    if (users.length === 0) {
      console.error(`[auth_confirmPasswordReset:${correlationId}] USER_NOT_FOUND user_id=${token.user_id}`);
      return Response.json({ 
        success: false,
        error: 'Código inválido ou expirado. Solicite um novo código.' 
      }, { status: 400 });
    }

    const user = users[0];

    // Generate new salt and hash password
    const newSalt = generateSalt();
    const newPasswordHash = await hashPassword(new_password, newSalt);

    console.log(`[auth_confirmPasswordReset:${correlationId}] UPDATING_PASSWORD user_id=${user.id}`);

    // Update user password + reset login attempts/lock
    await base44.asServiceRole.entities.AuthUser.update(user.id, {
      password_hash: newPasswordHash,
      password_salt: newSalt,
      failed_login_attempts: 0,
      locked_until: null
    });

    console.log(`[auth_confirmPasswordReset:${correlationId}] PASSWORD_UPDATED`);

    // Mark token as used
    await base44.asServiceRole.entities.PasswordResetToken.update(token.id, {
      used: true,
      used_at: new Date().toISOString()
    });

    // Revoke ALL active sessions for security (force re-login)
    const activeSessions = await base44.asServiceRole.entities.AuthSession.filter({
      user_id: user.id
    }, undefined, 100);

    const unrevokedSessions = activeSessions.filter(s => !s.revoked_at);
    
    for (const session of unrevokedSessions) {
      await base44.asServiceRole.entities.AuthSession.update(session.id, {
        revoked_at: new Date().toISOString()
      });
    }

    console.log(`[auth_confirmPasswordReset:${correlationId}] SESSIONS_REVOKED count=${unrevokedSessions.length}`);

    // Audit log
    await base44.asServiceRole.entities.AuthAuditLog.create({
      user_id: user.id,
      email: normalizedEmail,
      event_type: 'login_success',
      meta: { 
        reason: 'password_reset_confirmed',
        correlation_id: correlationId,
        sessions_revoked: unrevokedSessions.length
      }
    });

    console.log(`[auth_confirmPasswordReset:${correlationId}] SUCCESS`);

    return Response.json({ 
      success: true, 
      message: 'Senha alterada com sucesso! Você já pode fazer login com sua nova senha.'
    });

  } catch (error) {
    console.error(`[auth_confirmPasswordReset:${correlationId}] FATAL_ERROR:`, error);
    
    // Check if it's a pepper config error
    if (error.message?.includes('AUTH_HASH_PEPPER')) {
      return Response.json({ 
        success: false, 
        error: 'Configuração de segurança ausente. Contate o suporte.'
      }, { status: 500 });
    }
    
    return Response.json({ 
      success: false, 
      error: 'Não foi possível concluir agora. Tente novamente em alguns minutos.'
    }, { status: 500 });
  }
});