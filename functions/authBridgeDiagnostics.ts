import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createClient } from 'npm:@supabase/supabase-js@2';

const BUILD_SIGNATURE = 'auth-bridge-diagnostics-v1';

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

function generateRequestId() {
  return Math.random().toString(36).substring(2, 10);
}

Deno.serve(async (req) => {
  const requestId = generateRequestId();
  console.log(`[authBridgeDiagnostics] ${requestId} - START ${BUILD_SIGNATURE}`);
  
  try {
    if (req.method !== 'POST') {
      return Response.json({
        ok: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Método não permitido.' }
      }, { status: 405 });
    }

    const base44 = createClientFromRequest(req);
    
    // Admin-only authentication
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      console.warn(`[authBridgeDiagnostics] ${requestId} - UNAUTHORIZED role=${user?.role}`);
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

    if (!loginId || typeof loginId !== 'string' || !loginId.trim()) {
      return Response.json({
        ok: false,
        error: { code: 'MISSING_LOGIN_ID', message: 'loginId é obrigatório.' }
      }, { status: 400 });
    }

    const normalizedLoginId = loginId.trim().toLowerCase();
    
    console.log(`[authBridgeDiagnostics] ${requestId} - DIAGNOSTIC loginId=${normalizedLoginId.substring(0, 3)}*** admin=${user.email}`);

    const report = {
      request_id: requestId,
      build_signature: BUILD_SIGNATURE,
      admin_email: user.email,
      loginId: normalizedLoginId,
      timestamp: new Date().toISOString(),
      steps: []
    };

    // Step 1: Check Bridge configuration
    const bridgeBaseUrl = Deno.env.get('BRIDGE_BASE_URL');
    const bridgeApiKey = Deno.env.get('BRIDGE_API_KEY');
    
    if (!bridgeBaseUrl || !bridgeApiKey) {
      report.steps.push({
        step: 'bridge_config',
        status: 'FAILED',
        error: 'BRIDGE_BASE_URL ou BRIDGE_API_KEY não configurados'
      });
      report.overall_status = 'FAILED';
      return Response.json({ ok: false, data: report }, { status: 200 });
    }

    report.steps.push({
      step: 'bridge_config',
      status: 'OK',
      bridge_base_url: bridgeBaseUrl.replace(/https?:\/\//, '').split('/')[0] + '/***'
    });

    // Step 2: Check if account exists via Bridge /internal/auth/exists
    let bridgeExistsResponse;
    let bridgeUserNum = null;
    let bridgeExists = false;
    
    try {
      const bridgeUrl = `${bridgeBaseUrl}/internal/auth/exists`;
      
      const response = await fetch(bridgeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bridgeApiKey}`
        },
        body: JSON.stringify({ loginId: normalizedLoginId })
      });

      const rawText = await response.text();
      
      try {
        bridgeExistsResponse = JSON.parse(rawText);
      } catch (parseErr) {
        report.steps.push({
          step: 'bridge_exists_check',
          status: 'PARSE_ERROR',
          http_status: response.status,
          error: 'Resposta do Bridge não é JSON válido',
          raw_preview: rawText.substring(0, 200)
        });
        bridgeExistsResponse = null;
      }

      if (!response.ok) {
        report.steps.push({
          step: 'bridge_exists_check',
          status: 'ERROR',
          http_status: response.status,
          error: bridgeExistsResponse?.error || bridgeExistsResponse?.message || 'Bridge retornou erro',
          raw_shape: bridgeExistsResponse ? Object.keys(bridgeExistsResponse) : []
        });
      } else if (bridgeExistsResponse && bridgeExistsResponse.ok) {
        bridgeExists = bridgeExistsResponse.exists === true;
        bridgeUserNum = bridgeExistsResponse.userNum || bridgeExistsResponse.UserNum || null;
        
        if (bridgeUserNum && typeof bridgeUserNum !== 'number') {
          bridgeUserNum = parseInt(bridgeUserNum, 10);
        }
        
        report.steps.push({
          step: 'bridge_exists_check',
          status: 'OK',
          bridge_exists: bridgeExists,
          bridge_userNum: bridgeUserNum,
          raw_response_keys: Object.keys(bridgeExistsResponse)
        });
      } else if (bridgeExistsResponse && bridgeExistsResponse.ok === false) {
        report.steps.push({
          step: 'bridge_exists_check',
          status: 'NOT_FOUND',
          bridge_exists: false,
          bridge_userNum: null
        });
      } else {
        report.steps.push({
          step: 'bridge_exists_check',
          status: 'INVALID_RESPONSE',
          error: 'Bridge response não segue contrato esperado { ok, exists?, userNum? }',
          raw_shape: bridgeExistsResponse ? Object.keys(bridgeExistsResponse) : []
        });
      }
    } catch (bridgeError) {
      report.steps.push({
        step: 'bridge_exists_check',
        status: 'NETWORK_ERROR',
        error: bridgeError.message
      });
    }

    // Step 3: Check Supabase auth_users table
    const supabase = getSupabaseAdmin();
    const { data: supabaseUsers, error: sbError } = await supabase
      .from('auth_users')
      .select('user_id, login_id, email, is_active, game_user_num, role')
      .eq('login_id', normalizedLoginId)
      .limit(1);

    if (sbError) {
      report.steps.push({
        step: 'supabase_lookup',
        status: 'ERROR',
        error: sbError.message
      });
    } else if (supabaseUsers && supabaseUsers.length > 0) {
      const user = supabaseUsers[0];
      report.steps.push({
        step: 'supabase_lookup',
        status: 'FOUND',
        user_id: user.user_id,
        email: user.email,
        is_active: user.is_active,
        game_user_num: user.game_user_num,
        role: user.role
      });
    } else {
      report.steps.push({
        step: 'supabase_lookup',
        status: 'NOT_FOUND'
      });

      // Step 4: Check legacy Base44 entity
      const legacyUsers = await base44.asServiceRole.entities.AuthUser.filter({
        login_id: normalizedLoginId
      }, undefined, 1);

      if (legacyUsers.length > 0) {
        const legacyUser = legacyUsers[0];
        report.steps.push({
          step: 'legacy_entity_lookup',
          status: 'FOUND',
          user_id: legacyUser.id,
          email: legacyUser.email,
          is_active: legacyUser.is_active,
          game_user_num: legacyUser.game_user_num,
          role: legacyUser.role,
          note: 'User found in legacy entity, will be migrated on next login'
        });
      } else {
        report.steps.push({
          step: 'legacy_entity_lookup',
          status: 'NOT_FOUND'
        });
      }
    }

    // Determine overall status and check for mismatches
    const bridgeStep = report.steps.find(s => s.step === 'bridge_exists_check');
    const supabaseFound = report.steps.find(s => s.step === 'supabase_lookup');
    const legacyFound = report.steps.find(s => s.step === 'legacy_entity_lookup');

    const portalUserNum = supabaseFound?.game_user_num || legacyFound?.game_user_num || null;
    
    report.bridge_exists = bridgeExists;
    report.bridge_userNum = bridgeUserNum;
    report.portal_user_mapping_userNum = portalUserNum;
    report.mismatch = bridgeUserNum && portalUserNum && bridgeUserNum !== portalUserNum;

    if (bridgeExists) {
      if (supabaseFound?.status === 'FOUND' || legacyFound?.status === 'FOUND') {
        if (report.mismatch) {
          report.overall_status = 'MISMATCH';
          report.conclusion = `Conta existe no Bridge (userNum=${bridgeUserNum}) e no portal (userNum=${portalUserNum}), mas os userNums não correspondem. Contate suporte.`;
        } else {
          report.overall_status = 'READY';
          report.conclusion = 'Conta existe no Bridge e no portal. Login deve funcionar.';
        }
      } else {
        report.overall_status = 'PARTIAL';
        report.conclusion = 'Conta existe no Bridge mas não no portal. Primeiro login criará conta no portal.';
      }
    } else {
      report.overall_status = 'NOT_FOUND';
      report.conclusion = 'Conta não existe no Bridge. Não é possível fazer login.';
    }

    console.log(`[authBridgeDiagnostics] ${requestId} - COMPLETE status=${report.overall_status}`);

    return Response.json({ ok: true, data: report }, { status: 200 });

  } catch (error) {
    console.error(`[authBridgeDiagnostics] ${requestId} - FATAL_ERROR:`, error);
    return Response.json({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro interno ao executar diagnóstico.',
        detail: error.message
      }
    }, { status: 500 });
  }
});