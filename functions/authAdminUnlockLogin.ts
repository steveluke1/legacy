import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createClient } from 'npm:@supabase/supabase-js@2';

const BUILD_SIGNATURE = 'auth-admin-unlock-v1';

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

// SHA-256 hash (for IP matching)
async function sha256Hex(value) {
  if (!value || typeof value !== 'string') return 'null';
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 16);
}

function generateRequestId() {
  return Math.random().toString(36).substring(2, 10);
}

Deno.serve(async (req) => {
  const requestId = generateRequestId();
  console.log(`[authAdminUnlockLogin] ${requestId} - START ${BUILD_SIGNATURE}`);
  
  try {
    if (req.method !== 'POST') {
      return Response.json({
        ok: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Método não permitido.' }
      }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    
    // Admin-only authentication
    const admin = await base44.auth.me();
    
    if (!admin || admin.role !== 'admin') {
      console.warn(`[authAdminUnlockLogin] ${requestId} - UNAUTHORIZED role=${admin?.role}`);
      return Response.json({
        ok: false,
        error: { code: 'FORBIDDEN', message: 'Acesso restrito a administradores.' }
      }, { status: 403 });
    }

    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({
        ok: false,
        error: { code: 'INVALID_JSON', message: 'JSON inválido.' }
      }, { status: 400 });
    }

    const loginId = body.loginId;
    const clearIpHash = body.clearIpHash || false;
    const clearAllForLoginId = body.clearAllForLoginId || false;
    const ipAddress = body.ipAddress; // optional, for targeted unlock

    if (!loginId || typeof loginId !== 'string' || !loginId.trim()) {
      return Response.json({
        ok: false,
        error: { code: 'MISSING_LOGIN_ID', message: 'loginId é obrigatório.' }
      }, { status: 400 });
    }

    const normalizedLoginId = loginId.trim().toLowerCase();
    
    console.log(`[authAdminUnlockLogin] ${requestId} - UNLOCK loginId=${normalizedLoginId.substring(0, 3)}*** admin=${admin.email}`);

    const supabase = getSupabaseAdmin();
    const results = {
      request_id: requestId,
      build_signature: BUILD_SIGNATURE,
      admin_email: admin.email,
      loginId: normalizedLoginId,
      timestamp: new Date().toISOString(),
      actions: []
    };

    // Action 1: Clear user lockout in Supabase auth_users
    const { data: users, error: userError } = await supabase
      .from('auth_users')
      .select('user_id, email, failed_login_attempts, locked_until')
      .eq('login_id', normalizedLoginId)
      .limit(1);

    if (userError) {
      results.actions.push({
        action: 'clear_user_lockout',
        status: 'ERROR',
        error: userError.message
      });
    } else if (users && users.length > 0) {
      const user = users[0];
      const wasLocked = user.locked_until && new Date(user.locked_until) > new Date();
      
      const { error: updateError } = await supabase
        .from('auth_users')
        .update({
          failed_login_attempts: 0,
          locked_until: null
        })
        .eq('user_id', user.user_id);

      if (updateError) {
        results.actions.push({
          action: 'clear_user_lockout',
          status: 'ERROR',
          error: updateError.message
        });
      } else {
        results.actions.push({
          action: 'clear_user_lockout',
          status: 'SUCCESS',
          user_id: user.user_id,
          email: user.email,
          was_locked: wasLocked,
          previous_attempts: user.failed_login_attempts
        });
      }
    } else {
      results.actions.push({
        action: 'clear_user_lockout',
        status: 'NOT_FOUND',
        note: 'Usuário não encontrado no portal'
      });
    }

    // Action 2: Clear rate limit buckets
    if (clearIpHash && ipAddress) {
      const ipHash = await sha256Hex(ipAddress);
      const bucketKey = `login:${ipHash}`;
      
      try {
        const buckets = await base44.asServiceRole.entities.RateLimitBucket.filter({ key: bucketKey });
        
        if (buckets.length > 0) {
          for (const bucket of buckets) {
            await base44.asServiceRole.entities.RateLimitBucket.delete(bucket.id);
          }
          results.actions.push({
            action: 'clear_rate_limit_ip',
            status: 'SUCCESS',
            buckets_deleted: buckets.length,
            ip_hash_prefix: ipHash.substring(0, 8) + '***'
          });
        } else {
          results.actions.push({
            action: 'clear_rate_limit_ip',
            status: 'NOT_FOUND',
            note: 'Nenhum bucket encontrado para este IP'
          });
        }
      } catch (error) {
        results.actions.push({
          action: 'clear_rate_limit_ip',
          status: 'ERROR',
          error: error.message
        });
      }
    }

    if (clearAllForLoginId) {
      // Clear all rate limit buckets (if pattern matching is possible)
      // For now, this just confirms the action was requested
      results.actions.push({
        action: 'clear_all_buckets',
        status: 'INFO',
        note: 'clearAllForLoginId não implementado (rate limit é baseado em IP, não loginId)'
      });
    }

    // Action 3: Write audit log
    try {
      await base44.asServiceRole.entities.AuthAuditLog.create({
        user_id: admin.id,
        email: admin.email,
        event_type: 'admin_unlock_login',
        meta: {
          target_login_id: normalizedLoginId,
          actions: results.actions,
          request_id: requestId
        }
      });
      results.audit_logged = true;
    } catch (auditError) {
      console.error(`[authAdminUnlockLogin] ${requestId} - AUDIT_FAIL: ${auditError.message}`);
      results.audit_logged = false;
    }

    console.log(`[authAdminUnlockLogin] ${requestId} - COMPLETE actions=${results.actions.length}`);

    return Response.json({ ok: true, data: results }, { status: 200 });

  } catch (error) {
    console.error(`[authAdminUnlockLogin] ${requestId} - FATAL_ERROR:`, error);
    return Response.json({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro interno ao desbloquear login.',
        detail: error.message
      }
    }, { status: 500 });
  }
});