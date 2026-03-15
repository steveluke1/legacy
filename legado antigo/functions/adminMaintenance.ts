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
  return encodeHex(crypto.getRandomValues(new Uint8Array(16)));
}

Deno.serve(async (req) => {
  const correlationId = crypto.randomUUID();
  
  try {
    const base44 = createClientFromRequest(req);
    const { seedSecret, action, adminEmail, newPassword } = await req.json();

    const expectedSecret = Deno.env.get('SEED_SECRET');
    
    if (!expectedSecret) {
      return Response.json({
        success: false,
        error: 'SEED_SECRET não configurado no servidor',
        correlationId
      }, { status: 500 });
    }

    if (seedSecret !== expectedSecret) {
      return Response.json({
        success: false,
        error: 'seedSecret inválido',
        correlationId
      }, { status: 403 });
    }

    // ACTION: setPassword
    if (action === 'setPassword') {
      if (!adminEmail || !newPassword) {
        return Response.json({
          success: false,
          error: 'adminEmail e newPassword são obrigatórios',
          correlationId
        }, { status: 400 });
      }

      if (newPassword.length < 10) {
        return Response.json({
          success: false,
          error: 'Senha deve ter pelo menos 10 caracteres',
          correlationId
        }, { status: 400 });
      }

      const normalizedEmail = adminEmail.trim().toLowerCase();

      const admins = await base44.asServiceRole.entities.AdminUser.filter({
        email: normalizedEmail
      });

      if (admins.length === 0) {
        return Response.json({
          success: false,
          error: `Admin com email ${normalizedEmail} não encontrado`,
          correlationId
        }, { status: 404 });
      }

      const admin = admins[0];

      // Generate new salt and hash using encodeHex
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
        action: 'ADMIN_PASSWORD_RESET',
        metadata: {
          email: admin.email,
          username: admin.username,
          reset_via: 'adminMaintenance',
          correlationId
        }
      });

      console.log(`[adminMaintenance:${correlationId}] action=setPassword admin_id=${admin.id} success=true`);

      return Response.json({
        success: true,
        message: 'Senha do admin redefinida com sucesso',
        admin: {
          id: admin.id,
          email: admin.email,
          username: admin.username
        },
        correlationId
      });
    }

    // ACTION: diagnose
    if (action === 'diagnose') {
      if (!adminEmail) {
        return Response.json({
          success: false,
          error: 'adminEmail é obrigatório',
          correlationId
        }, { status: 400 });
      }

      const normalizedEmail = adminEmail.trim().toLowerCase();

      const admins = await base44.asServiceRole.entities.AdminUser.filter({
        email: normalizedEmail
      });

      if (admins.length === 0) {
        const allAdmins = await base44.asServiceRole.entities.AdminUser.filter({});
        return Response.json({
          success: false,
          found: false,
          searchedEmail: normalizedEmail,
          totalAdminsInDB: allAdmins.length,
          adminList: allAdmins.map(a => ({
            email: a.email,
            username: a.username,
            is_active: a.is_active
          })),
          correlationId
        });
      }

      const admin = admins[0];

      return Response.json({
        success: true,
        found: true,
        admin: {
          id: admin.id,
          email: admin.email,
          username: admin.username,
          is_active: admin.is_active,
          failed_login_attempts: admin.failed_login_attempts || 0,
          locked_until: admin.locked_until || null,
          last_login_at: admin.last_login_at || null,
          salt_length: admin.password_salt?.length || 0,
          hash_length: admin.password_hash?.length || 0
        },
        correlationId
      });
    }

    // Invalid action
    return Response.json({
      success: false,
      error: 'Ação inválida. Use "setPassword" ou "diagnose"',
      correlationId
    }, { status: 400 });

  } catch (error) {
    console.error(`[adminMaintenance:${correlationId}] error=${error.message}`);
    return Response.json({
      success: false,
      error: error.message || 'Erro ao executar manutenção',
      correlationId
    }, { status: 500 });
  }
});