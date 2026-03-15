import { createClient } from 'npm:@supabase/supabase-js@2';

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

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID().substring(0, 8);
  
  try {
    console.log(`[supabaseDebug:${requestId}] START`);
    
    // Get safe project host for evidence (no secrets)
    const url = Deno.env.get('SUPABASE_URL');
    if (!url) {
      return Response.json({
        ok: false,
        error: {
          code: 'MISSING_URL',
          message: 'SUPABASE_URL not configured'
        }
      }, { status: 503 });
    }
    
    const host = new URL(url).host;
    console.log(`[supabaseDebug:${requestId}] host=${host}`);
    
    const supabase = getSb();
    
    // Read counts BEFORE (head: true for count only)
    const { count: authUsersCountBefore, error: e1 } = await supabase
      .from('auth_users')
      .select('*', { count: 'exact', head: true });
    
    if (e1) {
      console.error(`[supabaseDebug:${requestId}] auth_users read failed: ${e1.message}`);
      return Response.json({
        ok: false,
        error: {
          code: 'SUPABASE_DEBUG_FAILED',
          message: 'Supabase debug failed'
        },
        details_hint: 'Check service role key / RLS / URL',
        failed_at: 'auth_users_read'
      }, { status: 503 });
    }
    
    const { count: authSessionsCountBefore, error: e2 } = await supabase
      .from('auth_sessions')
      .select('*', { count: 'exact', head: true });
    
    if (e2) {
      console.error(`[supabaseDebug:${requestId}] auth_sessions read failed: ${e2.message}`);
      return Response.json({
        ok: false,
        error: {
          code: 'SUPABASE_DEBUG_FAILED',
          message: 'Supabase debug failed'
        },
        details_hint: 'Check service role key / RLS / URL',
        failed_at: 'auth_sessions_read'
      }, { status: 503 });
    }
    
    const { count: authAuditLogCountBefore, error: e3 } = await supabase
      .from('auth_audit_log')
      .select('*', { count: 'exact', head: true });
    
    if (e3) {
      console.error(`[supabaseDebug:${requestId}] auth_audit_log read failed: ${e3.message}`);
      return Response.json({
        ok: false,
        error: {
          code: 'SUPABASE_DEBUG_FAILED',
          message: 'Supabase debug failed'
        },
        details_hint: 'Check service role key / RLS / URL',
        failed_at: 'auth_audit_log_read'
      }, { status: 503 });
    }
    
    console.log(`[supabaseDebug:${requestId}] BEFORE counts: users=${authUsersCountBefore} sessions=${authSessionsCountBefore} audit=${authAuditLogCountBefore}`);
    
    // INSERT test row into auth_audit_log
    const { data: insertedRow, error: e4 } = await supabase
      .from('auth_audit_log')
      .insert([{
        event_type: 'debug_probe',
        meta: {
          ts: new Date().toISOString(),
          note: 'base44->supabase write test',
          request_id: requestId
        }
      }])
      .select('id')
      .single();
    
    if (e4) {
      console.error(`[supabaseDebug:${requestId}] INSERT failed: ${e4.message}`);
      return Response.json({
        ok: false,
        error: {
          code: 'SUPABASE_DEBUG_FAILED',
          message: 'Supabase debug failed'
        },
        details_hint: 'Check service role key / RLS / URL',
        failed_at: 'auth_audit_log_insert',
        error_details: e4.message
      }, { status: 503 });
    }
    
    console.log(`[supabaseDebug:${requestId}] INSERT success: audit_log_id=${insertedRow?.id || 'unknown'}`);
    
    // Read count AFTER
    const { count: authAuditLogCountAfter, error: e5 } = await supabase
      .from('auth_audit_log')
      .select('*', { count: 'exact', head: true });
    
    if (e5) {
      console.error(`[supabaseDebug:${requestId}] auth_audit_log read after failed: ${e5.message}`);
      return Response.json({
        ok: false,
        error: {
          code: 'SUPABASE_DEBUG_FAILED',
          message: 'Supabase debug failed'
        },
        details_hint: 'Check service role key / RLS / URL',
        failed_at: 'auth_audit_log_read_after'
      }, { status: 503 });
    }
    
    console.log(`[supabaseDebug:${requestId}] AFTER count: audit=${authAuditLogCountAfter}`);
    console.log(`[supabaseDebug:${requestId}] SUCCESS - delta=${authAuditLogCountAfter - authAuditLogCountBefore}`);
    
    return Response.json({
      ok: true,
      supabase_host: host,
      before: {
        auth_users_count: authUsersCountBefore,
        auth_sessions_count: authSessionsCountBefore,
        auth_audit_log_count: authAuditLogCountBefore
      },
      inserted: {
        audit_log_id: insertedRow?.id || null
      },
      after: {
        auth_audit_log_count: authAuditLogCountAfter
      },
      delta: authAuditLogCountAfter - authAuditLogCountBefore,
      request_id: requestId
    });
    
  } catch (error) {
    console.error(`[supabaseDebug:${requestId}] FATAL:`, error);
    return Response.json({
      ok: false,
      error: {
        code: 'SUPABASE_DEBUG_FAILED',
        message: 'Supabase debug failed'
      },
      details_hint: 'Check service role key / RLS / URL'
    }, { status: 503 });
  }
});