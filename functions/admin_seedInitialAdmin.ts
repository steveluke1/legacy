import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { crypto } from 'https://deno.land/std@0.224.0/crypto/mod.ts';
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
  return encodeHex(crypto.getRandomValues(new Uint8Array(16)));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { seedSecret, username, password } = await req.json();

    const expectedSecret = Deno.env.get('SEED_SECRET');
    
    if (!expectedSecret) {
      return Response.json({
        success: false,
        error: 'Seed secret não configurado no servidor'
      }, { status: 500 });
    }

    if (seedSecret !== expectedSecret) {
      return Response.json({
        success: false,
        error: 'Seed secret inválido'
      }, { status: 403 });
    }

    // Check if admin already exists
    const existing = await base44.asServiceRole.entities.AdminUser.list();
    
    if (existing.length > 0) {
      return Response.json({
        success: false,
        error: 'Administrador inicial já existe. Esta função não pode ser executada novamente.'
      }, { status: 400 });
    }

    // Use provided username/password or defaults
    const adminUsername = username || 'admin';
    const adminPassword = password || 'Admin@2025';
    const adminEmail = `${adminUsername}@cabalziron.com`;

    // Create initial admin
    const salt = generateSalt();
    const passwordHash = await hashPassword(adminPassword, salt);

    const admin = await base44.asServiceRole.entities.AdminUser.create({
      email: adminEmail,
      username: adminUsername,
      password_hash: passwordHash,
      password_salt: salt,
      role: 'ADMIN',
      is_active: true,
      failed_login_attempts: 0
    });

    await base44.asServiceRole.entities.AdminAuditLog.create({
      admin_user_id: admin.id,
      action: 'ADMIN_INITIAL_SEED',
      metadata: {
        email: admin.email,
        username: admin.username
      }
    });

    return Response.json({
      success: true,
      message: 'Administrador inicial criado com sucesso',
      credentials: {
        email: adminEmail,
        username: adminUsername,
        password: adminPassword
      }
    });

  } catch (error) {
    console.error('Seed admin error:', error);
    return Response.json({
      success: false,
      error: 'Erro ao criar administrador inicial'
    }, { status: 500 });
  }
});