import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

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
  
  const bytes = new Uint8Array(hashBuffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateSalt() {
  const array = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { seedSecret, adminEmail, newPassword } = await req.json();

    const expectedSecret = Deno.env.get('SEED_SECRET');
    
    if (!expectedSecret) {
      return Response.json({
        success: false,
        error: 'SEED_SECRET não configurado no servidor'
      }, { status: 500 });
    }

    if (seedSecret !== expectedSecret) {
      return Response.json({
        success: false,
        error: 'seedSecret inválido'
      }, { status: 403 });
    }

    if (!adminEmail || !newPassword) {
      return Response.json({
        success: false,
        error: 'adminEmail e newPassword são obrigatórios'
      }, { status: 400 });
    }

    const normalizedEmail = adminEmail.trim().toLowerCase();

    // Find admin
    const admins = await base44.asServiceRole.entities.AdminUser.filter({
      email: normalizedEmail
    });

    if (admins.length === 0) {
      return Response.json({
        success: false,
        error: `Admin com email ${normalizedEmail} não encontrado`
      }, { status: 404 });
    }

    const admin = admins[0];

    // Generate new salt and hash
    const newSalt = generateSalt();
    const newHash = await hashPassword(newPassword, newSalt);

    // Update admin with new credentials
    await base44.asServiceRole.entities.AdminUser.update(admin.id, {
      password_hash: newHash,
      password_salt: newSalt,
      failed_login_attempts: 0,
      locked_until: null,
      is_active: true
    });

    // Audit log
    await base44.asServiceRole.entities.AdminAuditLog.create({
      admin_user_id: admin.id,
      action: 'ADMIN_PASSWORD_MIGRATED',
      metadata: {
        email: admin.email,
        username: admin.username,
        fixed_via: 'admin_fixExistingAdmins'
      }
    });

    return Response.json({
      success: true,
      message: 'Senha do admin corrigida com sucesso',
      admin: {
        id: admin.id,
        email: admin.email,
        username: admin.username
      },
      newCredentials: {
        email: admin.email,
        password: newPassword
      }
    });

  } catch (error) {
    console.error('[admin_fixExistingAdmins] Error:', error);
    return Response.json({
      success: false,
      error: error.message || 'Erro ao corrigir admin'
    }, { status: 500 });
  }
});