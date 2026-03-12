import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BUILD_SIGNATURE = 'lon-admin-me-20251223-v1';

// Verify JWT manually (no external deps)
async function verifyJWT(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signatureB64] = parts;
  const encoder = new TextEncoder();
  const data = encoder.encode(`${headerB64}.${payloadB64}`);
  const keyData = encoder.encode(secret);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const signature = Uint8Array.from(
    atob(signatureB64.replace(/-/g, '+').replace(/_/g, '/')),
    c => c.charCodeAt(0)
  );

  const valid = await crypto.subtle.verify('HMAC', key, signature, data);
  if (!valid) return null;

  const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
  
  // Check expiration
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  
  try {
    console.log(`[adminMe:${requestId}] build=${BUILD_SIGNATURE} stage=START`);
    
    const base44 = createClientFromRequest(req);
    const { token } = await req.json();

    if (!token) {
      console.log(`[adminMe:${requestId}] stage=VALIDATE status=400 reason=MISSING_TOKEN`);
      return Response.json({
        success: false,
        code: 'MISSING_TOKEN',
        message_ptbr: 'Token não fornecido.'
      }, { status: 400 });
    }

    const jwtSecret = Deno.env.get('ADMIN_JWT_SECRET');
    if (!jwtSecret) {
      console.error(`[adminMe:${requestId}] stage=ERROR reason=ADMIN_JWT_SECRET_MISSING`);
      return Response.json({
        success: false,
        code: 'CONFIG_ERROR',
        message_ptbr: 'Configuração de segurança ausente.'
      }, { status: 500 });
    }

    const payload = await verifyJWT(token, jwtSecret);
    if (!payload) {
      console.log(`[adminMe:${requestId}] stage=VERIFY status=401 reason=INVALID_TOKEN`);
      return Response.json({
        success: false,
        code: 'INVALID_TOKEN',
        message_ptbr: 'Token inválido ou expirado.'
      }, { status: 401 });
    }

    console.log(`[adminMe:${requestId}] stage=JWT_DECODED admin_id=${payload.sub} jti=${payload.jti}`);

    // Check session in database
    const sessions = await base44.asServiceRole.entities.AdminSession.filter({
      admin_user_id: payload.sub,
      token_jti: payload.jti
    }, undefined, 1);

    if (sessions.length === 0) {
      console.log(`[adminMe:${requestId}] stage=SESSION status=401 reason=SESSION_NOT_FOUND`);
      return Response.json({
        success: false,
        code: 'SESSION_NOT_FOUND',
        message_ptbr: 'Sessão não encontrada.'
      }, { status: 401 });
    }

    const session = sessions[0];
    if (session.revoked_at) {
      console.log(`[adminMe:${requestId}] stage=SESSION status=401 reason=SESSION_REVOKED`);
      return Response.json({
        success: false,
        code: 'SESSION_REVOKED',
        message_ptbr: 'Sessão revogada.'
      }, { status: 401 });
    }

    // Load admin user
    const admins = await base44.asServiceRole.entities.AdminUser.filter({
      id: payload.sub
    }, undefined, 1);

    if (admins.length === 0) {
      console.log(`[adminMe:${requestId}] stage=ADMIN status=401 reason=ADMIN_NOT_FOUND`);
      return Response.json({
        success: false,
        code: 'ADMIN_NOT_FOUND',
        message_ptbr: 'Administrador não encontrado.'
      }, { status: 401 });
    }

    const admin = admins[0];
    if (!admin.is_active) {
      console.log(`[adminMe:${requestId}] stage=ADMIN status=403 reason=ADMIN_INACTIVE`);
      return Response.json({
        success: false,
        code: 'ADMIN_INACTIVE',
        message_ptbr: 'Conta de administrador desativada.'
      }, { status: 403 });
    }

    console.log(`[adminMe:${requestId}] stage=SUCCESS admin_id=${admin.id}`);

    return Response.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        username: admin.username,
        role: admin.role
      },
      build_signature: BUILD_SIGNATURE
    });

  } catch (error) {
    console.error(`[adminMe:${requestId}] stage=ERROR message=${error.message}`);
    return Response.json({
      success: false,
      code: 'INTERNAL_ERROR',
      message_ptbr: 'Erro interno.'
    }, { status: 500 });
  }
});