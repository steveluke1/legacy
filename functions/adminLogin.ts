import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { encodeHex } from 'https://deno.land/std@0.224.0/encoding/hex.ts';

// CRITICAL: Must use encodeHex() to match admin_createAccount.js exactly
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
  
  // MUST use encodeHex - same as admin_createAccount.js line 26
  return encodeHex(new Uint8Array(hashBuffer));
}

async function createJWT(payload, secret) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  
  const payloadB64 = btoa(JSON.stringify(payload))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  
  const encoder = new TextEncoder();
  const data = encoder.encode(`${header}.${payloadB64}`);
  const keyData = encoder.encode(secret);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, data);
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  
  return `${header}.${payloadB64}.${signatureB64}`;
}

function generateJTI() {
  const array = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  const correlationId = crypto.randomUUID();
  const buildTag = 'lon-admin-login-20251223-v1';
  
  try {
    console.log(`[adminLogin:${correlationId}] build=${buildTag} stage=START`);
    
    const base44 = createClientFromRequest(req);
    const { email, password } = await req.json();

    console.log(`[adminLogin:${correlationId}] stage=PARSE email_length=${email?.length || 0} password_length=${password?.length || 0}`);

    if (!email || !password) {
      console.log(`[adminLogin:${correlationId}] stage=VALIDATE status=400 reason=MISSING_FIELDS`);
      return Response.json({
        success: false,
        code: 'MISSING_FIELDS',
        message_ptbr: 'Preencha e-mail e senha.',
        correlationId
      }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const maskedEmail = normalizedEmail.substring(0, 3) + '***@' + normalizedEmail.split('@')[1];
    console.log(`[adminLogin:${correlationId}] stage=NORMALIZE email=${maskedEmail}`);

    const admins = await base44.asServiceRole.entities.AdminUser.filter({
      email: normalizedEmail
    }, undefined, 1);

    console.log(`[adminLogin:${correlationId}] stage=FIND_ADMIN found=${admins.length > 0}`);

    if (admins.length === 0) {
      await base44.asServiceRole.entities.AdminAuditLog.create({
        action: 'ADMIN_LOGIN_FAILED',
        metadata: { reason: 'ADMIN_NOT_FOUND', email: normalizedEmail, correlationId }
      });

      console.log(`[adminLogin:${correlationId}] stage=RESULT status=401 reason=ADMIN_NOT_FOUND`);
      return Response.json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        message_ptbr: 'Usuário ou senha inválidos.',
        correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 401 });
    }

    const admin = admins[0];
    console.log(`[adminLogin:${correlationId}] stage=ADMIN_LOADED admin_id=${admin.id} is_active=${admin.is_active} failed_attempts=${admin.failed_login_attempts || 0} has_salt=${!!admin.password_salt} has_hash=${!!admin.password_hash}`);

    if (!admin.is_active) {
      console.log(`[adminLogin:${correlationId}] stage=CHECK_ACTIVE status=403 reason=ADMIN_INACTIVE`);
      return Response.json({
        success: false,
        code: 'ADMIN_INACTIVE',
        message_ptbr: 'Acesso do admin desativado.',
        correlationId
      }, { status: 403 });
    }

    // Check if currently locked (progressive backoff)
    if (admin.locked_until) {
      const lockedUntil = new Date(admin.locked_until);
      if (lockedUntil > new Date()) {
        const remainingSeconds = Math.ceil((lockedUntil - new Date()) / 1000);
        console.log(`[adminLogin:${correlationId}] stage=CHECK_LOCKOUT status=429 reason=RATE_LIMIT remaining=${remainingSeconds}s`);
        return Response.json({
          success: false,
          code: 'RATE_LIMIT',
          message_ptbr: `Muitas tentativas. Tente novamente em ${remainingSeconds} segundos.`,
          retry_after_seconds: remainingSeconds,
          correlationId
        }, { status: 429 });
      }
    }

    // Hash password using encodeHex (same as admin_createAccount.js)
    const passwordHash = await hashPassword(password, admin.password_salt);
    const passwordVerified = passwordHash === admin.password_hash;
    
    console.log(`[adminLogin:${correlationId}] stage=VERIFY_PASSWORD verified=${passwordVerified} computed_hash_length=${passwordHash.length} stored_hash_length=${admin.password_hash.length} hash_prefix_match=${passwordHash.substring(0, 8) === admin.password_hash.substring(0, 8)}`);
    
    if (!passwordVerified) {
      const newAttempts = (admin.failed_login_attempts || 0) + 1;
      const updateData = {
        failed_login_attempts: newAttempts
      };

      // Progressive soft lock: 5s → 10s → 20s (max 3 locks before hard reset)
      let lockSeconds = 0;
      if (newAttempts >= 8) {
        lockSeconds = 20; // 8+ attempts: 20s
      } else if (newAttempts >= 6) {
        lockSeconds = 10; // 6-7 attempts: 10s
      } else if (newAttempts >= 5) {
        lockSeconds = 5;  // 5 attempts: 5s
      }

      if (lockSeconds > 0) {
        const lockUntil = new Date(Date.now() + lockSeconds * 1000);
        updateData.locked_until = lockUntil.toISOString();

        await base44.asServiceRole.entities.AdminAuditLog.create({
          admin_user_id: admin.id,
          action: 'ADMIN_SOFT_LOCK',
          metadata: { attempts: newAttempts, lockSeconds, correlationId }
        });
      }

      await base44.asServiceRole.entities.AdminUser.update(admin.id, updateData);

      await base44.asServiceRole.entities.AdminAuditLog.create({
        admin_user_id: admin.id,
        action: 'ADMIN_LOGIN_FAILED',
        metadata: { attempts: newAttempts, reason: 'INVALID_PASSWORD', correlationId }
      });

      console.log(`[adminLogin:${correlationId}] stage=RESULT status=${lockSeconds > 0 ? 429 : 401} reason=INVALID_PASSWORD attempts=${newAttempts} lock=${lockSeconds}s`);
      
      if (lockSeconds > 0) {
        return Response.json({
          success: false,
          code: 'RATE_LIMIT',
          message_ptbr: `Muitas tentativas. Aguarde ${lockSeconds} segundos.`,
          retry_after_seconds: lockSeconds,
          correlationId
        }, { status: 429 });
      }
      
      return Response.json({
        success: false,
        code: 'INVALID_CREDENTIALS',
        message_ptbr: 'Usuário ou senha inválidos.',
        correlationId
      }, { status: 401 });
    }

    // Success - reset attempts and update last login
    await base44.asServiceRole.entities.AdminUser.update(admin.id, {
      failed_login_attempts: 0,
      locked_until: null,
      last_login_at: new Date().toISOString()
    });

    const jti = generateJTI();
    const exp = Math.floor(Date.now() / 1000) + (8 * 60 * 60);
    
    await base44.asServiceRole.entities.AdminSession.create({
      admin_user_id: admin.id,
      token_jti: jti,
      expires_at: new Date(exp * 1000).toISOString()
    });

    const jwtSecret = Deno.env.get('ADMIN_JWT_SECRET');
    if (!jwtSecret) {
      console.error(`[adminLogin:${correlationId}] stage=ERROR reason=ADMIN_JWT_SECRET_MISSING`);
      return Response.json({
        success: false,
        code: 'CONFIG_ERROR',
        message_ptbr: 'Configuração de segurança ausente. Contate o administrador do sistema.',
        correlationId
      }, { status: 500 });
    }

    const token = await createJWT({
      sub: admin.id,
      email: admin.email,
      username: admin.username,
      role: admin.role,
      jti: jti,
      iat: Math.floor(Date.now() / 1000),
      exp: exp
    }, jwtSecret);

    await base44.asServiceRole.entities.AdminAuditLog.create({
      admin_user_id: admin.id,
      action: 'ADMIN_LOGIN_SUCCESS',
      metadata: { correlationId }
    });

    console.log(`[adminLogin:${correlationId}] stage=SUCCESS token_issued=true admin_id=${admin.id}`);

    return Response.json({
      success: true,
      token: token,
      admin: {
        id: admin.id,
        email: admin.email,
        username: admin.username,
        role: admin.role
      },
      expiresAt: new Date(exp * 1000).toISOString(),
      correlationId,
      build_signature: buildTag
    });

  } catch (error) {
    console.error(`[adminLogin:${correlationId}] stage=ERROR message=${error.message} stack=${error.stack}`);
    return Response.json({
      success: false,
      code: 'INTERNAL_ERROR',
      message_ptbr: 'Erro interno. Tente novamente.',
      correlationId
    }, { status: 500 });
  }
});