import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { crypto } from 'https://deno.land/std@0.224.0/crypto/mod.ts';
import { encodeHex } from 'https://deno.land/std@0.224.0/encoding/hex.ts';

const BUILD_SIGNATURE = 'lon-admin-setupTest-20251223-v1';

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
    console.log(`[admin_setupTest:${correlationId}] build=${BUILD_SIGNATURE} stage=START`);
    
    const base44 = createClientFromRequest(req);
    const { seedSecret, email, password } = await req.json();

    const expectedSecret = Deno.env.get('SEED_SECRET');
    
    if (!expectedSecret || seedSecret !== expectedSecret) {
      console.log(`[admin_setupTest:${correlationId}] stage=AUTH_FAILED`);
      return Response.json({
        success: false,
        code: 'FORBIDDEN',
        message_ptbr: 'Acesso negado.',
        correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 403 });
    }

    if (!email || !password || password.length < 10) {
      console.log(`[admin_setupTest:${correlationId}] stage=VALIDATE_FAILED`);
      return Response.json({
        success: false,
        code: 'INVALID_INPUT',
        message_ptbr: 'E-mail e senha válidos são obrigatórios.',
        correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    
    // Find existing admin
    const admins = await base44.asServiceRole.entities.AdminUser.filter({
      email: normalizedEmail
    }, undefined, 1);

    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);

    console.log(`[admin_setupTest:${correlationId}] stage=HASH_COMPUTED salt_length=${salt.length} hash_length=${passwordHash.length}`);

    if (admins.length > 0) {
      // Update existing admin
      const admin = admins[0];
      await base44.asServiceRole.entities.AdminUser.update(admin.id, {
        password_hash: passwordHash,
        password_salt: salt,
        failed_login_attempts: 0,
        locked_until: null,
        is_active: true
      });

      console.log(`[admin_setupTest:${correlationId}] stage=SUCCESS action=UPDATED admin_id=${admin.id}`);

      return Response.json({
        success: true,
        action: 'updated',
        admin: {
          id: admin.id,
          email: admin.email,
          username: admin.username,
          role: admin.role
        },
        correlationId,
        build_signature: BUILD_SIGNATURE
      });
    } else {
      // Create new admin
      const username = email.split('@')[0];
      const admin = await base44.asServiceRole.entities.AdminUser.create({
        email: normalizedEmail,
        username,
        password_hash: passwordHash,
        password_salt: salt,
        role: 'ADMIN',
        is_active: true,
        failed_login_attempts: 0
      });

      console.log(`[admin_setupTest:${correlationId}] stage=SUCCESS action=CREATED admin_id=${admin.id}`);

      return Response.json({
        success: true,
        action: 'created',
        admin: {
          id: admin.id,
          email: admin.email,
          username: admin.username,
          role: admin.role
        },
        correlationId,
        build_signature: BUILD_SIGNATURE
      });
    }

  } catch (error) {
    console.error(`[admin_setupTest:${correlationId}] stage=ERROR message=${error.message}`);
    return Response.json({
      success: false,
      code: 'INTERNAL_ERROR',
      message_ptbr: 'Erro interno.',
      correlationId,
      build_signature: BUILD_SIGNATURE
    }, { status: 500 });
  }
});