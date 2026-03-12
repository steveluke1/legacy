import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { getClientIp, hashIp, hashString, rateLimitCheck } from './securityHelpers.js';

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

// Generate 6-digit code
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

Deno.serve(async (req) => {
  const correlationId = crypto.randomUUID();
  
  try {
    console.log(`[auth_requestPasswordReset:${correlationId}] START`);
    
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return Response.json({
        success: false,
        error: 'Email é obrigatório'
      }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    
    // Email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return Response.json({
        success: false,
        error: 'Informe um email válido'
      }, { status: 400 });
    }

    // Rate limiting (IP-based: 3 req/hour)
    const clientIp = getClientIp(req);
    const ipHash = await hashIp(clientIp);
    const bucketKeyIp = `pwd_reset_ip:${ipHash}`;
    
    const rateLimitIp = await rateLimitCheck(base44.asServiceRole, bucketKeyIp, 3, 3600, 3600);
    
    if (!rateLimitIp.allowed) {
      console.warn(`[auth_requestPasswordReset:${correlationId}] RATE_LIMIT_IP ipHash=${ipHash.substring(0, 8)}***`);
      // Anti-enumeration: still return success
      return Response.json({ 
        success: true, 
        message: 'Se o email estiver cadastrado, você receberá um código de recuperação em instantes.'
      });
    }

    // Rate limiting (email-based: 3 req/hour) - use peppered hash
    const emailHashPeppered = await hashWithPepper(normalizedEmail);
    const bucketKeyEmail = `pwd_reset_email:${emailHashPeppered}`;
    
    const rateLimitEmail = await rateLimitCheck(base44.asServiceRole, bucketKeyEmail, 3, 3600, 3600);
    
    if (!rateLimitEmail.allowed) {
      console.warn(`[auth_requestPasswordReset:${correlationId}] RATE_LIMIT_EMAIL emailHash=${emailHashPeppered.substring(0, 8)}***`);
      // Anti-enumeration: still return success
      return Response.json({ 
        success: true, 
        message: 'Se o email estiver cadastrado, você receberá um código de recuperação em instantes.'
      });
    }

    // Check if user exists (use AuthUser, not User)
    const users = await base44.asServiceRole.entities.AuthUser.filter({ 
      email: normalizedEmail 
    }, undefined, 1);
    
    // ANTI-ENUMERATION: Always return success regardless
    const standardResponse = {
      success: true, 
      message: 'Se o email estiver cadastrado, você receberá um código de recuperação em instantes.'
    };
    
    if (!users || users.length === 0) {
      console.log(`[auth_requestPasswordReset:${correlationId}] USER_NOT_FOUND (returning success for anti-enumeration)`);
      
      // Audit log (no user_id)
      await base44.asServiceRole.entities.AuthAuditLog.create({
        email: normalizedEmail,
        event_type: 'login_failed',
        meta: { 
          reason: 'password_reset_unknown_email',
          correlation_id: correlationId 
        }
      });
      
      return Response.json(standardResponse);
    }

    const user = users[0];
    console.log(`[auth_requestPasswordReset:${correlationId}] USER_FOUND user_id=${user.id}`);

    // Generate code and hash with pepper
    const code = generateCode();
    const codeHashPeppered = await hashWithPepper(code);
    const ipHashPeppered = await hashWithPepper(clientIp);
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000).toISOString();

    // Create token record with peppered hashes
    await base44.asServiceRole.entities.PasswordResetToken.create({
      user_id: user.id,
      email: normalizedEmail,
      email_hash: emailHashPeppered,
      code_hash: codeHashPeppered,
      expires_at: expiresAt,
      used: false,
      ip_hash: ipHashPeppered,
      attempts: 0
    });

    console.log(`[auth_requestPasswordReset:${correlationId}] TOKEN_CREATED`);

    // Send email
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'Legacy of Nevareth',
        to: normalizedEmail,
        subject: 'Recuperação de senha — Legacy of Nevareth',
        body: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #19E0FF;">Recuperação de senha</h2>
            <p>Olá,</p>
            <p>Você solicitou a recuperação de senha da sua conta.</p>
            <p>Seu código de verificação é:</p>
            <div style="background: #0C121C; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #19E0FF; letter-spacing: 4px;">${code}</span>
            </div>
            <p style="color: #666;">Este código expira em <strong>20 minutos</strong>.</p>
            <p style="color: #666;">Se você não solicitou esta recuperação, ignore este email. Sua conta permanece segura.</p>
            <br>
            <p style="color: #999; font-size: 12px;">Equipe Legacy of Nevareth</p>
          </div>
        `
      });
      
      console.log(`[auth_requestPasswordReset:${correlationId}] EMAIL_SENT`);
    } catch (emailError) {
      console.error(`[auth_requestPasswordReset:${correlationId}] EMAIL_FAILED:`, emailError.message);
      // Don't fail the request if email fails - return success anyway
    }

    // Audit log
    await base44.asServiceRole.entities.AuthAuditLog.create({
      user_id: user.id,
      email: normalizedEmail,
      event_type: 'login_failed',
      meta: { 
        reason: 'password_reset_requested',
        correlation_id: correlationId 
      }
    });

    console.log(`[auth_requestPasswordReset:${correlationId}] SUCCESS`);
    
    return Response.json(standardResponse);

  } catch (error) {
    console.error(`[auth_requestPasswordReset:${correlationId}] FATAL_ERROR:`, error);
    
    // Check if it's a pepper config error
    if (error.message?.includes('AUTH_HASH_PEPPER')) {
      return Response.json({ 
        success: false, 
        error: 'Configuração de segurança ausente. Contate o suporte.'
      }, { status: 500 });
    }
    
    return Response.json({ 
      success: false, 
      error: 'Erro ao processar solicitação. Tente novamente.'
    }, { status: 500 });
  }
});