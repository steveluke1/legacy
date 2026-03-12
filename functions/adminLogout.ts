import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const BUILD_SIGNATURE = 'lon-admin-logout-20251223-v2';

// Manual JWT verification without external deps
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
  const correlationId = crypto.randomUUID();
  
  try {
    console.log(`[adminLogout:${correlationId}] build=${BUILD_SIGNATURE} stage=START`);
    
    const base44 = createClientFromRequest(req);
    const { token } = await req.json();

    if (!token) {
      console.log(`[adminLogout:${correlationId}] stage=NO_TOKEN success=true`);
      return Response.json({ 
        success: true, 
        correlationId,
        build_signature: BUILD_SIGNATURE
      });
    }

    const jwtSecret = Deno.env.get('ADMIN_JWT_SECRET');
    if (!jwtSecret) {
      console.error(`[adminLogout:${correlationId}] stage=ERROR reason=ADMIN_JWT_SECRET_MISSING`);
      return Response.json({
        success: false,
        code: 'MISSING_SECRET',
        message_ptbr: 'Configuração de segurança ausente. Contate o administrador.',
        correlationId,
        build_signature: BUILD_SIGNATURE
      }, { status: 500 });
    }

    let payload;
    try {
      payload = await verifyJWT(token, jwtSecret);
    } catch (e) {
      console.log(`[adminLogout:${correlationId}] stage=INVALID_TOKEN success=true`);
      return Response.json({ 
        success: true, 
        correlationId,
        build_signature: BUILD_SIGNATURE
      });
    }

    const sessions = await base44.asServiceRole.entities.AdminSession.filter({
      token_jti: payload.jti
    }, undefined, 1);

    if (sessions.length > 0) {
      await base44.asServiceRole.entities.AdminSession.update(sessions[0].id, {
        revoked_at: new Date().toISOString()
      });
      console.log(`[adminLogout:${correlationId}] stage=REVOKE_SESSION session_id=${sessions[0].id}`);
    }

    await base44.asServiceRole.entities.AdminAuditLog.create({
      admin_user_id: payload.sub,
      action: 'ADMIN_LOGOUT',
      metadata: { correlationId }
    });

    console.log(`[adminLogout:${correlationId}] stage=SUCCESS admin_id=${payload.sub}`);

    return Response.json({ 
      success: true, 
      correlationId,
      build_signature: BUILD_SIGNATURE
    });

  } catch (error) {
    console.error(`[adminLogout:${correlationId}] stage=ERROR message=${error.message}`);
    return Response.json({ 
      success: true, 
      correlationId,
      build_signature: BUILD_SIGNATURE
    });
  }
});