import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createClient } from 'npm:@supabase/supabase-js@2';

const BUILD_SIGNATURE = 'sb-auth-me-20260105-v1';

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
  
  // Verify expiration
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error('TOKEN_EXPIRED');
  }
  
  // Verify signature
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
  console.log(`[auth_me] ${requestId} - START ${BUILD_SIGNATURE}`);
  
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
      console.log(`[auth_me] ${requestId} - NO_TOKEN`);
      return Response.json({
        success: false,
        error: 'Token não fornecido.',
        request_id: requestId,
        build_signature: BUILD_SIGNATURE
      }, { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Require JWT_SECRET
    const jwtSecret = Deno.env.get('JWT_SECRET');
    if (!jwtSecret) {
      console.error(`[auth_me] ${requestId} - JWT_SECRET_MISSING`);
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

    // Verify JWT
    let payload;
    try {
      payload = await verifyJwtHs256(token, jwtSecret);
      console.log(`[auth_me] ${requestId} - JWT_VERIFIED sub=${payload.sub}`);
    } catch (e) {
      console.log(`[auth_me] ${requestId} - JWT_INVALID reason=${e.message}`);
      const errorMsg = e.message === 'TOKEN_EXPIRED' 
        ? 'Sua sessão expirou. Faça login novamente.'
        : 'Sessão inválida. Faça login novamente.';
      
      return Response.json({
        success: false,
        error: errorMsg,
        request_id: requestId,
        build_signature: BUILD_SIGNATURE
      }, { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validate required claims
    if (!payload.sub || !payload.jti) {
      console.log(`[auth_me] ${requestId} - MISSING_CLAIMS`);
      return Response.json({
        success: false,
        error: 'Sessão inválida. Faça login novamente.',
        request_id: requestId,
        build_signature: BUILD_SIGNATURE
      }, { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = getSupabaseAdmin();

    // Check session validity in Supabase
    const { data: sessions, error: sessionError } = await supabase
      .from('auth_sessions')
      .select('*')
      .eq('token_jti', payload.jti)
      .eq('user_id', payload.sub)
      .limit(1);

    if (sessionError) {
      console.error(`[auth_me] ${requestId} - SESSION_QUERY_ERROR: ${sessionError.message}`);
      throw new Error('Database query failed');
    }

    if (!sessions || sessions.length === 0) {
      console.log(`[auth_me] ${requestId} - SESSION_NOT_FOUND`);
      
      // Audit log
      await supabase.from('auth_audit_log').insert([{
        user_id: payload.sub,
        email: payload.email || 'unknown',
        event_type: 'me_failed',
        meta: { reason: 'session_not_found', request_id: requestId }
      }]);
      
      return Response.json({
        success: false,
        error: 'Sessão expirada. Faça login novamente.',
        request_id: requestId,
        build_signature: BUILD_SIGNATURE
      }, { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const session = sessions[0];

    // Check if revoked
    if (session.revoked_at) {
      console.log(`[auth_me] ${requestId} - SESSION_REVOKED`);
      
      await supabase.from('auth_audit_log').insert([{
        user_id: payload.sub,
        email: payload.email || 'unknown',
        event_type: 'me_failed',
        meta: { reason: 'session_revoked', request_id: requestId }
      }]);
      
      return Response.json({
        success: false,
        error: 'Sessão expirada. Faça login novamente.',
        request_id: requestId,
        build_signature: BUILD_SIGNATURE
      }, { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if expired
    if (new Date(session.expires_at) < new Date()) {
      console.log(`[auth_me] ${requestId} - SESSION_EXPIRED`);
      
      await supabase.from('auth_audit_log').insert([{
        user_id: payload.sub,
        email: payload.email || 'unknown',
        event_type: 'me_failed',
        meta: { reason: 'session_expired', request_id: requestId }
      }]);
      
      return Response.json({
        success: false,
        error: 'Sessão expirada. Faça login novamente.',
        request_id: requestId,
        build_signature: BUILD_SIGNATURE
      }, { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get user from Supabase
    const { data: users, error: userError } = await supabase
      .from('auth_users')
      .select('user_id, email, login_id, game_user_num, role, is_active')
      .eq('user_id', payload.sub)
      .limit(1);

    if (userError) {
      console.error(`[auth_me] ${requestId} - USER_QUERY_ERROR: ${userError.message}`);
      throw new Error('Database query failed');
    }

    if (!users || users.length === 0) {
      console.log(`[auth_me] ${requestId} - USER_NOT_FOUND`);
      
      await supabase.from('auth_audit_log').insert([{
        user_id: payload.sub,
        email: payload.email || 'unknown',
        event_type: 'me_failed',
        meta: { reason: 'user_not_found', request_id: requestId }
      }]);
      
      return Response.json({
        success: false,
        error: 'Sessão expirada. Faça login novamente.',
        request_id: requestId,
        build_signature: BUILD_SIGNATURE
      }, { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = users[0];

    if (!user.is_active) {
      console.log(`[auth_me] ${requestId} - USER_INACTIVE`);
      
      await supabase.from('auth_audit_log').insert([{
        user_id: user.user_id,
        email: user.email,
        event_type: 'me_failed',
        meta: { reason: 'user_inactive', request_id: requestId }
      }]);
      
      return Response.json({
        success: false,
        error: 'Conta desativada.',
        request_id: requestId,
        build_signature: BUILD_SIGNATURE
      }, { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`[auth_me] ${requestId} - SUCCESS`);

    // Audit log success
    await supabase.from('auth_audit_log').insert([{
      user_id: user.user_id,
      email: user.email,
      event_type: 'me_success',
      meta: { request_id: requestId }
    }]);

    return Response.json({
      success: true,
      user: {
        id: user.user_id,
        email: user.email,
        login_id: user.login_id,
        game_user_num: user.game_user_num,
        role: user.role || 'user'
      },
      request_id: requestId,
      build_signature: BUILD_SIGNATURE
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[auth_me] ${requestId} - FATAL_ERROR:`, error);
    return Response.json({
      success: false,
      error: 'Erro ao verificar sessão.',
      request_id: requestId,
      build_signature: BUILD_SIGNATURE
    }, { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});