import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BUILD_SIGNATURE = 'auth-bridge-smoke-test-v1';

// In-memory cache to prevent rapid repeated tests (60s cooldown)
const testCache = new Map();

function generateRequestId() {
  return Math.random().toString(36).substring(2, 10);
}

Deno.serve(async (req) => {
  const requestId = generateRequestId();
  console.log(`[authBridgeLoginSmokeTest] ${requestId} - START ${BUILD_SIGNATURE}`);
  
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
      console.warn(`[authBridgeLoginSmokeTest] ${requestId} - UNAUTHORIZED role=${admin?.role}`);
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
    const password = body.password;

    if (!loginId || typeof loginId !== 'string' || !loginId.trim()) {
      return Response.json({
        ok: false,
        error: { code: 'MISSING_LOGIN_ID', message: 'loginId é obrigatório.' }
      }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length === 0) {
      return Response.json({
        ok: false,
        error: { code: 'MISSING_PASSWORD', message: 'password é obrigatório.' }
      }, { status: 400 });
    }

    const normalizedLoginId = loginId.trim().toLowerCase();
    
    // Check cooldown (60s per loginId)
    const cacheKey = normalizedLoginId;
    const lastTest = testCache.get(cacheKey);
    const now = Date.now();
    
    if (lastTest && now - lastTest < 60000) {
      const remainingSeconds = Math.ceil((60000 - (now - lastTest)) / 1000);
      return Response.json({
        ok: false,
        error: {
          code: 'COOLDOWN_ACTIVE',
          message: `Aguarde ${remainingSeconds}s antes de testar novamente este loginId.`
        }
      }, { status: 429 });
    }

    console.log(`[authBridgeLoginSmokeTest] ${requestId} - TEST loginId=${normalizedLoginId.substring(0, 3)}*** admin=${admin.email} (password NOT logged)`);

    // Update cache
    testCache.set(cacheKey, now);

    // Call Bridge /internal/auth/login
    const bridgeBaseUrl = Deno.env.get('BRIDGE_BASE_URL');
    const bridgeApiKey = Deno.env.get('BRIDGE_API_KEY');
    
    if (!bridgeBaseUrl || !bridgeApiKey) {
      return Response.json({
        ok: false,
        error: {
          code: 'BRIDGE_NOT_CONFIGURED',
          message: 'BRIDGE_BASE_URL ou BRIDGE_API_KEY não configurados'
        }
      }, { status: 500 });
    }

    let bridgeResponse;
    try {
      const bridgeUrl = `${bridgeBaseUrl}/internal/auth/login`;
      
      const response = await fetch(bridgeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bridgeApiKey}`
        },
        body: JSON.stringify({
          loginId: normalizedLoginId,
          password: password
        })
      });

      const rawText = await response.text();
      
      try {
        bridgeResponse = JSON.parse(rawText);
      } catch (parseErr) {
        return Response.json({
          ok: false,
          error: {
            code: 'BRIDGE_RESPONSE_INVALID',
            message: 'Resposta do Bridge não é JSON válido',
            raw_preview: rawText.substring(0, 200)
          }
        }, { status: 502 });
      }

      const result = {
        request_id: requestId,
        build_signature: BUILD_SIGNATURE,
        admin_email: admin.email,
        loginId: normalizedLoginId,
        timestamp: new Date().toISOString(),
        bridge_http_status: response.status,
        bridge_ok: bridgeResponse.ok || false,
        bridge_userNum: bridgeResponse.userNum || bridgeResponse.UserNum || null,
        bridge_error: bridgeResponse.error || null,
        bridge_response_keys: Object.keys(bridgeResponse)
      };

      if (!response.ok || !bridgeResponse.ok) {
        result.test_result = 'FAILED';
        result.note = 'Bridge rejeitou as credenciais ou retornou erro';
      } else {
        result.test_result = 'SUCCESS';
        result.note = 'Bridge aceitou as credenciais';
      }

      console.log(`[authBridgeLoginSmokeTest] ${requestId} - COMPLETE test_result=${result.test_result}`);

      return Response.json({ ok: true, data: result }, { status: 200 });

    } catch (bridgeError) {
      console.error(`[authBridgeLoginSmokeTest] ${requestId} - BRIDGE_ERROR: ${bridgeError.message}`);
      return Response.json({
        ok: false,
        error: {
          code: 'BRIDGE_NETWORK_ERROR',
          message: 'Erro de rede ao chamar Bridge',
          detail: bridgeError.message
        }
      }, { status: 503 });
    }

  } catch (error) {
    console.error(`[authBridgeLoginSmokeTest] ${requestId} - FATAL_ERROR:`, error);
    return Response.json({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro interno ao executar smoke test.',
        detail: error.message
      }
    }, { status: 500 });
  }
});