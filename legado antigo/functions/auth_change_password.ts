import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createClient } from 'npm:@supabase/supabase-js@2';

const BUILD_SIGNATURE = 'sb-auth-change-password-20260105-v2';

// Extract token from request: Authorization header OR body.token
function getTokenFromRequest(req, body) {
  // 1. Try Authorization header first
  const authHeader = req.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  // 2. Fallback to body.token
  return body?.token || null;
}

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

// Manual JWT verification with HS256
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

// PBKDF2 password hashing
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
  
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate random salt
function generateSalt() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateRequestId() {
  return Math.random().toString(36).substring(2, 10);
}

Deno.serve(async (req) => {
  const requestId = generateRequestId();
  console.log(`[auth_change_password] ${requestId} - START ${BUILD_SIGNATURE}`);
  
  try {
    if (req.method !== 'POST') {
      return Response.json({
        success: false,
        error: 'Método não permitido.',
        code: 'METHOD_NOT_ALLOWED',
        build_signature: BUILD_SIGNATURE
      }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    
    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({
        success: false,
        error: 'Requisição inválida.',
        code: 'INVALID_REQUEST',
        build_signature: BUILD_SIGNATURE
      }, { status: 400 });
    }

    const { currentPassword, newPassword, confirmNewPassword } = body || {};
    
    // Get token from Authorization header OR body.token
    const token = getTokenFromRequest(req, body);

    if (!token) {
      console.log(`[auth_change_password] ${requestId} - NO_TOKEN`);
      return Response.json({
        success: false,
        error: 'Sessão expirada. Faça login novamente.',
        code: 'SESSION_EXPIRED',
        build_signature: BUILD_SIGNATURE
      }, { status: 401 });
    }

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      console.log(`[auth_change_password] ${requestId} - MISSING_FIELDS`);
      return Response.json({
        success: false,
        error: 'Preencha todos os campos.',
        code: 'MISSING_FIELDS',
        build_signature: BUILD_SIGNATURE
      }, { status: 400 });
    }

    if (newPassword !== confirmNewPassword) {
      console.log(`[auth_change_password] ${requestId} - PASSWORD_MISMATCH`);
      return Response.json({
        success: false,
        error: 'As senhas não conferem.',
        code: 'PASSWORD_MISMATCH',
        build_signature: BUILD_SIGNATURE
      }, { status: 400 });
    }

    // Validate new password strength
    if (newPassword.length < 10) {
      console.log(`[auth_change_password] ${requestId} - PASSWORD_TOO_SHORT`);
      return Response.json({
        success: false,
        error: 'A nova senha deve ter pelo menos 10 caracteres.',
        code: 'PASSWORD_WEAK',
        build_signature: BUILD_SIGNATURE
      }, { status: 400 });
    }

    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumberOrSymbol = /[0-9!@#$%^&*(),.?":{}|<>]/.test(newPassword);

    if (!hasUppercase || !hasLowercase || !hasNumberOrSymbol) {
      console.log(`[auth_change_password] ${requestId} - PASSWORD_WEAK`);
      return Response.json({
        success: false,
        error: 'A senha deve ter maiúsculas, minúsculas e número ou símbolo.',
        code: 'PASSWORD_WEAK',
        build_signature: BUILD_SIGNATURE
      }, { status: 400 });
    }

    // Verify JWT
    const jwtSecret = Deno.env.get('JWT_SECRET');
    if (!jwtSecret) {
      console.error(`[auth_change_password] ${requestId} - JWT_SECRET_MISSING`);
      return Response.json({
        success: false,
        error: 'Configuração do servidor inválida.',
        code: 'INTERNAL_ERROR',
        build_signature: BUILD_SIGNATURE
      }, { status: 500 });
    }

    let payload;
    try {
      payload = await verifyJwtHs256(token, jwtSecret);
      console.log(`[auth_change_password] ${requestId} - JWT_VERIFIED sub=${payload.sub}`);
    } catch (e) {
      console.log(`[auth_change_password] ${requestId} - JWT_INVALID reason=${e.message}`);
      return Response.json({
        success: false,
        error: 'Sessão expirada. Faça login novamente.',
        code: 'INVALID_SESSION',
        build_signature: BUILD_SIGNATURE
      }, { status: 401 });
    }

    if (!payload.sub || !payload.jti) {
      console.log(`[auth_change_password] ${requestId} - MISSING_CLAIMS`);
      return Response.json({
        success: false,
        error: 'Sessão inválida. Faça login novamente.',
        code: 'INVALID_SESSION',
        build_signature: BUILD_SIGNATURE
      }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Validate session
    const { data: sessions, error: sessionError } = await supabase
      .from('auth_sessions')
      .select('*')
      .eq('token_jti', payload.jti)
      .eq('user_id', payload.sub)
      .limit(1);

    if (sessionError || !sessions || sessions.length === 0) {
      console.log(`[auth_change_password] ${requestId} - SESSION_NOT_FOUND`);
      return Response.json({
        success: false,
        error: 'Sessão expirada. Faça login novamente.',
        code: 'INVALID_SESSION',
        build_signature: BUILD_SIGNATURE
      }, { status: 401 });
    }

    const session = sessions[0];

    if (session.revoked_at || new Date(session.expires_at) < new Date()) {
      console.log(`[auth_change_password] ${requestId} - SESSION_INVALID`);
      return Response.json({
        success: false,
        error: 'Sessão expirada. Faça login novamente.',
        code: 'INVALID_SESSION',
        build_signature: BUILD_SIGNATURE
      }, { status: 401 });
    }

    // Get user
    const { data: users, error: userError } = await supabase
      .from('auth_users')
      .select('*')
      .eq('user_id', payload.sub)
      .limit(1);

    if (userError || !users || users.length === 0) {
      console.error(`[auth_change_password] ${requestId} - USER_NOT_FOUND`);
      return Response.json({
        success: false,
        error: 'Usuário não encontrado.',
        code: 'INVALID_SESSION',
        build_signature: BUILD_SIGNATURE
      }, { status: 401 });
    }

    const user = users[0];

    // Verify current password
    const currentPasswordHash = await hashPassword(currentPassword, user.password_salt);
    if (currentPasswordHash !== user.password_hash) {
      console.log(`[auth_change_password] ${requestId} - INVALID_CURRENT_PASSWORD`);
      
      await supabase.from('auth_audit_log').insert([{
        user_id: user.user_id,
        email: user.email,
        event_type: 'password_change_failed',
        meta: { reason: 'invalid_current_password', request_id: requestId }
      }]);
      
      return Response.json({
        success: false,
        error: 'Senha atual incorreta.',
        code: 'INVALID_CURRENT_PASSWORD',
        build_signature: BUILD_SIGNATURE
      }, { status: 400 });
    }

    // Generate new password hash
    const newSalt = generateSalt();
    const newPasswordHash = await hashPassword(newPassword, newSalt);

    // Update password in Supabase
    const { error: updateError } = await supabase
      .from('auth_users')
      .update({
        password_hash: newPasswordHash,
        password_salt: newSalt,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.user_id);

    if (updateError) {
      console.error(`[auth_change_password] ${requestId} - UPDATE_ERROR: ${updateError.message}`);
      throw new Error('Failed to update password');
    }

    console.log(`[auth_change_password] ${requestId} - PASSWORD_UPDATED`);

    // Revoke ALL sessions for this user
    const { error: revokeError } = await supabase
      .from('auth_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', user.user_id)
      .is('revoked_at', null);

    if (revokeError) {
      console.error(`[auth_change_password] ${requestId} - REVOKE_ERROR: ${revokeError.message}`);
      // Non-fatal, continue
    } else {
      console.log(`[auth_change_password] ${requestId} - ALL_SESSIONS_REVOKED`);
    }

    // Audit log
    await supabase.from('auth_audit_log').insert([{
      user_id: user.user_id,
      email: user.email,
      event_type: 'password_changed',
      meta: { request_id: requestId }
    }]);

    console.log(`[auth_change_password] ${requestId} - SUCCESS`);

    return Response.json({
      success: true,
      message_ptbr: 'Senha alterada com sucesso.',
      require_relogin: true,
      build_signature: BUILD_SIGNATURE
    });

  } catch (error) {
    console.error(`[auth_change_password] ${requestId} - FATAL_ERROR:`, error);
    return Response.json({
      success: false,
      error: 'Erro ao alterar senha. Tente novamente.',
      code: 'INTERNAL_ERROR',
      build_signature: BUILD_SIGNATURE
    }, { status: 500 });
  }
});