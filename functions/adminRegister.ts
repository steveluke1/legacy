import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { encodeHex } from 'https://deno.land/std@0.224.0/encoding/hex.ts';

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

function generateSalt() {
  const array = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
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
  
  try {
    console.log(`[adminRegister:${correlationId}] stage=START`);
    
    const base44 = createClientFromRequest(req);
    const { email, username, password, inviteCode } = await req.json();

    // Validate invite code
    const expectedInviteCode = Deno.env.get('ADMIN_INVITE_CODE');
    if (!expectedInviteCode) {
      console.log(`[adminRegister:${correlationId}] stage=CONFIG_ERROR reason=NO_INVITE_CODE_SET`);
      return Response.json({
        success: false,
        error: 'Registro de administradores não está disponível no momento. Contate o suporte.',
        correlationId,
        reasonCode: 'CONFIG_ERROR'
      }, { status: 500 });
    }

    if (!inviteCode || inviteCode !== expectedInviteCode) {
      console.log(`[adminRegister:${correlationId}] stage=VALIDATE_INVITE status=403 reason=INVALID_INVITE`);
      return Response.json({
        success: false,
        error: 'Código de convite inválido.',
        correlationId,
        reasonCode: 'INVALID_INVITE'
      }, { status: 403 });
    }

    // Validate inputs
    if (!email || !username || !password) {
      return Response.json({
        success: false,
        error: 'Preencha todos os campos.',
        reasonCode: 'MISSING_FIELDS'
      }, { status: 400 });
    }

    if (username.length < 3 || username.length > 30) {
      return Response.json({
        success: false,
        error: 'Nome de usuário deve ter entre 3 e 30 caracteres.',
        reasonCode: 'INVALID_USERNAME_LENGTH'
      }, { status: 400 });
    }

    if (password.length < 8) {
      return Response.json({
        success: false,
        error: 'Senha deve ter no mínimo 8 caracteres.',
        reasonCode: 'WEAK_PASSWORD'
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Response.json({
        success: false,
        error: 'Email inválido.',
        reasonCode: 'INVALID_EMAIL'
      }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if admin already exists
    const existingAdmins = await base44.asServiceRole.entities.AdminUser.filter({
      email: normalizedEmail
    });

    if (existingAdmins.length > 0) {
      console.log(`[adminRegister:${correlationId}] stage=CHECK_DUPLICATE status=409 reason=EMAIL_EXISTS`);
      return Response.json({
        success: false,
        error: 'Email já cadastrado.',
        correlationId,
        reasonCode: 'EMAIL_EXISTS'
      }, { status: 409 });
    }

    // Check username
    const existingUsernames = await base44.asServiceRole.entities.AdminUser.filter({
      username: username
    });

    if (existingUsernames.length > 0) {
      console.log(`[adminRegister:${correlationId}] stage=CHECK_DUPLICATE status=409 reason=USERNAME_EXISTS`);
      return Response.json({
        success: false,
        error: 'Nome de usuário já existe.',
        correlationId,
        reasonCode: 'USERNAME_EXISTS'
      }, { status: 409 });
    }

    // Create admin
    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);

    console.log(`[adminRegister:${correlationId}] stage=CREATE_ADMIN username=${username}`);

    const newAdmin = await base44.asServiceRole.entities.AdminUser.create({
      email: normalizedEmail,
      username: username,
      password_hash: passwordHash,
      password_salt: salt,
      role: 'ADMIN',
      is_active: true,
      failed_login_attempts: 0
    });

    // Create session
    const jti = generateJTI();
    const exp = Math.floor(Date.now() / 1000) + (8 * 60 * 60);
    
    await base44.asServiceRole.entities.AdminSession.create({
      admin_user_id: newAdmin.id,
      token_jti: jti,
      expires_at: new Date(exp * 1000).toISOString()
    });

    const jwtSecret = Deno.env.get('ADMIN_JWT_SECRET') || 'admin-secret-change-me';

    const token = await createJWT({
      sub: newAdmin.id,
      email: newAdmin.email,
      username: newAdmin.username,
      role: newAdmin.role,
      jti: jti,
      iat: Math.floor(Date.now() / 1000),
      exp: exp
    }, jwtSecret);

    await base44.asServiceRole.entities.AdminAuditLog.create({
      admin_user_id: newAdmin.id,
      action: 'ADMIN_REGISTERED',
      metadata: { correlationId }
    });

    console.log(`[adminRegister:${correlationId}] stage=SUCCESS admin_id=${newAdmin.id}`);

    return Response.json({
      success: true,
      token: token,
      admin: {
        id: newAdmin.id,
        email: newAdmin.email,
        username: newAdmin.username,
        role: newAdmin.role
      },
      expiresAt: new Date(exp * 1000).toISOString(),
      correlationId
    });

  } catch (error) {
    console.error(`[adminRegister:${correlationId}] stage=ERROR message=${error.message} stack=${error.stack}`);
    return Response.json({
      success: false,
      error: 'Erro interno. Tente novamente.',
      correlationId,
      reasonCode: 'INTERNAL_ERROR'
    }, { status: 500 });
  }
});