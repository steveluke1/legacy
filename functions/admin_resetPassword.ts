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
    const { seedSecret, email, newPassword } = await req.json();

    const expectedSecret = Deno.env.get('SEED_SECRET');
    
    if (!expectedSecret) {
      return Response.json({
        success: false,
        error: 'Seed secret não configurado'
      }, { status: 500 });
    }

    if (seedSecret !== expectedSecret) {
      return Response.json({
        success: false,
        error: 'Seed secret inválido'
      }, { status: 403 });
    }

    if (!email || !newPassword) {
      return Response.json({
        success: false,
        error: 'Email e nova senha são obrigatórios'
      }, { status: 400 });
    }

    if (newPassword.length < 10) {
      return Response.json({
        success: false,
        error: 'Senha deve ter pelo menos 10 caracteres'
      }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find admin
    const admins = await base44.asServiceRole.entities.AdminUser.filter({
      email: normalizedEmail
    }, undefined, 1);

    if (admins.length === 0) {
      return Response.json({
        success: false,
        error: 'Admin não encontrado'
      }, { status: 404 });
    }

    const admin = admins[0];

    // Generate new salt and hash
    const newSalt = generateSalt();
    const newHash = await hashPassword(newPassword, newSalt);

    // Update admin
    await base44.asServiceRole.entities.AdminUser.update(admin.id, {
      password_hash: newHash,
      password_salt: newSalt,
      failed_login_attempts: 0,
      locked_until: null
    });

    // Log action
    await base44.asServiceRole.entities.AdminAuditLog.create({
      admin_user_id: admin.id,
      action: 'ADMIN_PASSWORD_RESET',
      metadata: {
        email: admin.email,
        reset_via: 'admin_resetPassword'
      }
    });

    return Response.json({
      success: true,
      message: 'Senha redefinida com sucesso',
      admin: {
        email: admin.email,
        username: admin.username
      },
      newCredentials: {
        email: admin.email,
        password: newPassword
      }
    });

  } catch (error) {
    console.error('[admin_resetPassword] Error:', error);
    return Response.json({
      success: false,
      error: error.message || 'Erro ao redefinir senha'
    }, { status: 500 });
  }
});