import { createClient } from 'npm:@supabase/supabase-js@2';

const BUILD_SIGNATURE = 'sb-auth-proof-20260105-v2';

// Supabase admin singleton
let _sb = null;
function getSb() {
  if (_sb) return _sb;
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Missing Supabase secrets');
  _sb = createClient(url, key, { auth: { persistSession: false } });
  return _sb;
}

// Get safe host (no secrets)
function getSbHost() {
  const url = Deno.env.get('SUPABASE_URL');
  if (!url) return 'unknown';
  try {
    return new URL(url).host;
  } catch {
    return 'unknown';
  }
}

// PBKDF2 password hashing (matching auth_register)
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

// Generate random JTI for session token
function generateJTI() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID().substring(0, 8);
  
  try {
    console.log(`[supabase_auth_proof:${requestId}] START ${BUILD_SIGNATURE}`);
    
    const sbHost = getSbHost();
    console.log(`[supabase_auth_proof:${requestId}] sb_host=${sbHost}`);
    
    const supabase = getSb();
    
    // Count BEFORE
    console.log(`[supabase_auth_proof:${requestId}] Reading BEFORE counts...`);
    const [usersResult, sessionsResult, auditResult] = await Promise.all([
      supabase.from('auth_users').select('*', { count: 'exact', head: true }),
      supabase.from('auth_sessions').select('*', { count: 'exact', head: true }),
      supabase.from('auth_audit_log').select('*', { count: 'exact', head: true })
    ]);
    
    if (usersResult.error || sessionsResult.error || auditResult.error) {
      console.error(`[supabase_auth_proof:${requestId}] COUNT_BEFORE_ERROR`);
      return Response.json({
        ok: false,
        error: {
          code: 'COUNT_BEFORE_FAILED',
          message: 'Failed to read Supabase counts'
        },
        build_signature: BUILD_SIGNATURE
      }, { status: 503 });
    }
    
    const beforeCounts = {
      users: usersResult.count || 0,
      sessions: sessionsResult.count || 0,
      audit: auditResult.count || 0
    };
    
    console.log(`[supabase_auth_proof:${requestId}] BEFORE users=${beforeCounts.users} sessions=${beforeCounts.sessions} audit=${beforeCounts.audit}`);
    
    // Generate unique values
    const timestamp = Date.now();
    const userId = crypto.randomUUID();
    const loginId = `proof_${timestamp}`;
    const email = `${loginId}@proof.test`;
    const password = `ProofPass${timestamp}!`;
    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);
    
    console.log(`[supabase_auth_proof:${requestId}] Generated user_id=${userId} login_id=${loginId}`);
    
    // INSERT user
    const { data: insertedUser, error: userError } = await supabase
      .from('auth_users')
      .insert([{
        user_id: userId,
        login_id: loginId,
        email: email,
        username: loginId,
        password_hash: passwordHash,
        password_salt: salt,
        is_active: true,
        failed_login_attempts: 0,
        role: 'user'
      }])
      .select('user_id, login_id, email')
      .single();
    
    if (userError || !insertedUser) {
      console.error(`[supabase_auth_proof:${requestId}] USER_INSERT_ERROR: ${userError?.message || 'No user returned'}`);
      return Response.json({
        ok: false,
        error: {
          code: 'USER_INSERT_FAILED',
          message: 'Failed to insert user into auth_users'
        },
        build_signature: BUILD_SIGNATURE
      }, { status: 503 });
    }
    
    console.log(`[supabase_auth_proof:${requestId}] USER_INSERTED user_id=${insertedUser.user_id}`);
    
    // INSERT session
    const jti = generateJTI();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    const { data: insertedSession, error: sessionError } = await supabase
      .from('auth_sessions')
      .insert([{
        user_id: userId,
        token_jti: jti,
        expires_at: expiresAt
      }])
      .select('session_id, token_jti')
      .single();
    
    if (sessionError || !insertedSession) {
      console.error(`[supabase_auth_proof:${requestId}] SESSION_INSERT_ERROR: ${sessionError?.message || 'No session returned'}`);
      return Response.json({
        ok: false,
        error: {
          code: 'SESSION_INSERT_FAILED',
          message: 'Failed to insert session into auth_sessions'
        },
        build_signature: BUILD_SIGNATURE
      }, { status: 503 });
    }
    
    console.log(`[supabase_auth_proof:${requestId}] SESSION_INSERTED session_id=${insertedSession.session_id} jti=${jti}`);
    
    // INSERT audit
    const { data: insertedAudit, error: auditError } = await supabase
      .from('auth_audit_log')
      .insert([{
        user_id: userId,
        email: email,
        event_type: 'auth_proof',
        meta: {
          login_id: loginId,
          request_id: requestId,
          note: 'Deterministic proof: user + session insert'
        }
      }])
      .select('id')
      .single();
    
    if (auditError) {
      console.error(`[supabase_auth_proof:${requestId}] AUDIT_INSERT_ERROR: ${auditError.message}`);
      // Not fatal, continue
    } else {
      console.log(`[supabase_auth_proof:${requestId}] AUDIT_INSERTED id=${insertedAudit?.id}`);
    }
    
    // Count AFTER
    console.log(`[supabase_auth_proof:${requestId}] Reading AFTER counts...`);
    const [usersResultAfter, sessionsResultAfter, auditResultAfter] = await Promise.all([
      supabase.from('auth_users').select('*', { count: 'exact', head: true }),
      supabase.from('auth_sessions').select('*', { count: 'exact', head: true }),
      supabase.from('auth_audit_log').select('*', { count: 'exact', head: true })
    ]);
    
    const afterCounts = {
      users: usersResultAfter.count || 0,
      sessions: sessionsResultAfter.count || 0,
      audit: auditResultAfter.count || 0
    };
    
    console.log(`[supabase_auth_proof:${requestId}] AFTER users=${afterCounts.users} sessions=${afterCounts.sessions} audit=${afterCounts.audit}`);
    
    const delta = {
      users: afterCounts.users - beforeCounts.users,
      sessions: afterCounts.sessions - beforeCounts.sessions,
      audit: afterCounts.audit - beforeCounts.audit
    };
    
    console.log(`[supabase_auth_proof:${requestId}] SUCCESS delta_users=${delta.users} delta_sessions=${delta.sessions} delta_audit=${delta.audit}`);
    
    return Response.json({
      ok: true,
      sb_host: sbHost,
      before: beforeCounts,
      inserted: {
        user_id: insertedUser.user_id,
        login_id: insertedUser.login_id,
        session_jti: jti
      },
      after: afterCounts,
      delta: delta,
      build_signature: BUILD_SIGNATURE,
      request_id: requestId
    });
    
  } catch (error) {
    console.error(`[supabase_auth_proof:${requestId}] FATAL:`, error);
    return Response.json({
      ok: false,
      error: {
        code: 'PROOF_FAILED',
        message: 'Auth proof test failed'
      },
      build_signature: BUILD_SIGNATURE
    }, { status: 503 });
  }
});