import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createClient } from 'npm:@supabase/supabase-js@2';

const BUILD_SIGNATURE = 'sb-auth-logout-20260105-v1';

// Supabase admin singleton
let _supabase = null;
function getSupabaseAdmin() {
  if (_supabase) return _supabase;
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Missing Supabase secrets');
  _supabase = createClient(url, key, { auth: { persistSession: false } });
  return _supabase;
}

// Manual JWT verification with HS256 (no external deps)
async function verifyJwtHs256(token, secret) {
  const encoder = new TextEncoder();
  
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('INVALID_TOKEN_FORMAT');
  }
  
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  
  // Decode payload
  const payloadJson = atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/'));
  const payload = JSON.parse(payloadJson);
  
  // Verify signature (but ignore expiration for logout - allow expired tokens to be revoked)
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  
  const signatureBytes = Uint8Array.from(
    atob(encodedSignature.replace(/-/g, '+').replace(/_/g, '/')),
    c => c.charCodeAt(0)
  );
  
  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    signatureBytes,
    encoder.encode(`${encodedHeader}.${encodedPayload}`)
  );
  
  if (!isValid) {
    throw new Error('INVALID_SIGNATURE');
  }
  
  return payload;
}

function generateRequestId() {
  return Math.random().toString(36).substring(2, 10);
}



Deno.serve(async (req) => {
  const requestId = generateRequestId();
  console.log(`[auth_logout] ${requestId} - START ${BUILD_SIGNATURE}`);
  
  try {
    if (req.method !== 'POST') {
      return Response.json({
        success: false,
        error: 'Método não permitido.',
        request_id: requestId,
        build_signature: BUILD_SIGNATURE
      }, { 
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const base44 = createClientFromRequest(req);
    
    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({
        success: false,
        error: 'Requisição inválida.',
        request_id: requestId,
        build_signature: BUILD_SIGNATURE
      }, { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { token } = body || {};

    if (!token) {
      console.log(`[auth_logout] ${requestId} - NO_TOKEN (idempotent success)`);
      return Response.json({
        success: true,
        request_id: requestId,
        build_signature: BUILD_SIGNATURE
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Require JWT_SECRET
    const jwtSecret = Deno.env.get('JWT_SECRET');
    if (!jwtSecret) {
      console.error(`[auth_logout] ${requestId} - JWT_SECRET_MISSING`);
      return Response.json({
        success: false,
        error: 'Configuração do servidor inválida. Tente novamente mais tarde.',
        request_id: requestId,
        build_signature: BUILD_SIGNATURE
      }, { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify JWT (allow expired tokens for logout)
    let payload;
    try {
      payload = await verifyJwtHs256(token, jwtSecret);
      console.log(`[auth_logout] ${requestId} - JWT_VERIFIED jti=${payload.jti}`);
    } catch (e) {
      console.log(`[auth_logout] ${requestId} - JWT_INVALID reason=${e.message} (idempotent success)`);
      // Even if token is invalid, return success (idempotent logout)
      return Response.json({
        success: true,
        request_id: requestId,
        build_signature: BUILD_SIGNATURE
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = getSupabaseAdmin();

    // Find session in Supabase
    const { data: sessions, error: sessionError } = await supabase
      .from('auth_sessions')
      .select('*')
      .eq('token_jti', payload.jti)
      .limit(1);

    if (sessionError) {
      console.error(`[auth_logout] ${requestId} - SESSION_QUERY_ERROR: ${sessionError.message} (idempotent success)`);
      // Fail-open: return success anyway
      return Response.json({
        success: true,
        request_id: requestId,
        build_signature: BUILD_SIGNATURE
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!sessions || sessions.length === 0) {
      console.log(`[auth_logout] ${requestId} - SESSION_NOT_FOUND (idempotent success)`);
      // Session doesn't exist - already logged out or never existed
      return Response.json({
        success: true,
        request_id: requestId,
        build_signature: BUILD_SIGNATURE
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const session = sessions[0];

    // If already revoked, still return success (idempotent)
    if (session.revoked_at) {
      console.log(`[auth_logout] ${requestId} - ALREADY_REVOKED (idempotent success)`);
      return Response.json({
        success: true,
        request_id: requestId,
        build_signature: BUILD_SIGNATURE
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Revoke session in Supabase
    const { error: updateError } = await supabase
      .from('auth_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('session_id', session.session_id);

    if (updateError) {
      console.error(`[auth_logout] ${requestId} - SESSION_UPDATE_ERROR: ${updateError.message} (idempotent success)`);
      // Fail-open: return success anyway
      return Response.json({
        success: true,
        request_id: requestId,
        build_signature: BUILD_SIGNATURE
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`[auth_logout] ${requestId} - SESSION_REVOKED`);

    // Audit log
    await supabase.from('auth_audit_log').insert([{
      user_id: payload.sub,
      email: payload.email || 'unknown',
      event_type: 'logout_success',
      meta: { request_id: requestId }
    }]);

    console.log(`[auth_logout] ${requestId} - SUCCESS`);

    return Response.json({
      success: true,
      request_id: requestId,
      build_signature: BUILD_SIGNATURE
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[auth_logout] ${requestId} - FATAL_ERROR:`, error);
    // Even on error, return success for logout (fail-open for logout)
    return Response.json({
      success: true,
      request_id: requestId,
      build_signature: BUILD_SIGNATURE
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
  }
});