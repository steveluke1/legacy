import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { crypto } from 'https://deno.land/std@0.224.0/crypto/mod.ts';
import { encodeHex } from 'https://deno.land/std@0.224.0/encoding/hex.ts';

const BUILD_SIGNATURE = 'lon-admin-createAccount-20251223-v1';

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
  return encodeHex(crypto.getRandomValues(new Uint8Array(16)));
}

Deno.serve(async (req) => {
  const correlationId = crypto.randomUUID();
  
  try {
    console.log(`[admin_createAccount:${correlationId}] build=${BUILD_SIGNATURE} stage=START`);
    
    const base44 = createClientFromRequest(req);
    const { seedSecret, email, username, password } = await req.json();

    const expectedSecret = Deno.env.get('SEED_SECRET');
    
    if (!expectedSecret) {
      console.error(`[admin_createAccount:${correlationId}] stage=ERROR reason=SEED_SECRET_MISSING`);
      return Response.json({
        success: false,
        code: 'MISSING_SECRET',
        message_ptbr: 'Configuração de segurança ausente no servidor.',
        correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 500 });
    }

    if (seedSecret !== expectedSecret) {
      console.log(`[admin_createAccount:${correlationId}] stage=AUTH_FAILED reason=INVALID_SECRET`);
      return Response.json({
        success: false,
        code: 'FORBIDDEN',
        message_ptbr: 'Acesso negado.',
        correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 403 });
    }

    // Validate email
    if (!email || !email.includes('@')) {
      console.log(`[admin_createAccount:${correlationId}] stage=VALIDATE reason=INVALID_EMAIL`);
      return Response.json({
        success: false,
        code: 'INVALID_EMAIL',
        message_ptbr: 'E-mail inválido.',
        correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 400 });
    }

    // Validate username and password
    if (!username || username.length < 3) {
      console.log(`[admin_createAccount:${correlationId}] stage=VALIDATE reason=INVALID_USERNAME`);
      return Response.json({
        success: false,
        code: 'INVALID_USERNAME',
        message_ptbr: 'Nome de usuário deve ter pelo menos 3 caracteres.',
        correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 400 });
    }

    if (!password || password.length < 10) {
      console.log(`[admin_createAccount:${correlationId}] stage=VALIDATE reason=WEAK_PASSWORD`);
      return Response.json({
        success: false,
        code: 'WEAK_PASSWORD',
        message_ptbr: 'Senha deve ter pelo menos 10 caracteres.',
        correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email or username already exists
    const existingByEmail = await base44.asServiceRole.entities.AdminUser.filter({ 
      email: normalizedEmail
    });
    
    if (existingByEmail.length > 0) {
      console.log(`[admin_createAccount:${correlationId}] stage=CONFLICT reason=EMAIL_EXISTS`);
      return Response.json({
        success: false,
        code: 'EMAIL_EXISTS',
        message_ptbr: 'E-mail já está em uso.',
        correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 409 });
    }

    const existingByUsername = await base44.asServiceRole.entities.AdminUser.filter({ 
      username 
    });
    
    if (existingByUsername.length > 0) {
      console.log(`[admin_createAccount:${correlationId}] stage=CONFLICT reason=USERNAME_EXISTS`);
      return Response.json({
        success: false,
        code: 'USERNAME_EXISTS',
        message_ptbr: 'Nome de usuário já está em uso.',
        correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 409 });
    }

    // Create admin
    console.log(`[admin_createAccount:${correlationId}] stage=CREATE_ADMIN email=${normalizedEmail.substring(0, 3)}***`);
    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);

    const admin = await base44.asServiceRole.entities.AdminUser.create({
      email: normalizedEmail,
      username,
      password_hash: passwordHash,
      password_salt: salt,
      role: 'ADMIN',
      is_active: true,
      failed_login_attempts: 0
    });

    await base44.asServiceRole.entities.AdminAuditLog.create({
      admin_user_id: admin.id,
      action: 'ADMIN_ACCOUNT_CREATED',
      target_type: 'AdminUser',
      target_id: admin.id,
      metadata: {
        email: admin.email,
        username: admin.username,
        created_via: 'admin_createAccount',
        correlationId
      }
    });

    console.log(`[admin_createAccount:${correlationId}] stage=SUCCESS admin_id=${admin.id}`);

    return Response.json({
      success: true,
      message_ptbr: 'Conta de administrador criada com sucesso.',
      admin: {
        id: admin.id,
        email: admin.email,
        username: admin.username,
        role: admin.role,
        is_active: admin.is_active
      },
      correlationId,
      build_signature: BUILD_SIGNATURE
    });

  } catch (error) {
    console.error(`[admin_createAccount:${correlationId}] stage=ERROR message=${error.message}`);
    return Response.json({
      success: false,
      code: 'INTERNAL_ERROR',
      message_ptbr: 'Erro ao criar conta de administrador.',
      correlationId,
      build_signature: BUILD_SIGNATURE
    }, { status: 500 });
  }
});