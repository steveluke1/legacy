// functions/bridgeAlzRelease.js
// Calls Bridge: POST /internal/alz/release
// VERSION: 6.0.0 - INLINED callBridge (no local imports due to platform limitations)

const BUILD_STAMP = "bridgeAlzRelease-v6-inline";

// Inlined callBridge (no imports to avoid deploy 404)
async function callBridge(endpoint, payload) {
  const bridgeBaseUrl = Deno.env.get('BRIDGE_BASE_URL');
  const bridgeApiKey = Deno.env.get('BRIDGE_API_KEY');

  if (!bridgeBaseUrl || !bridgeApiKey) {
    return {
      ok: false,
      error: {
        code: 'BRIDGE_NOT_CONFIGURED',
        message: 'Bridge não configurado',
        _build: BUILD_STAMP
      }
    };
  }

  const cleanBase = bridgeBaseUrl.trim().replace(/\/+$/, '').replace(/\/internal$/, '');
  const url = new URL(endpoint.startsWith('/') ? endpoint : `/${endpoint}`, cleanBase).toString();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bridge-api-key': bridgeApiKey,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    let text;
    let json;
    try {
      text = await response.text();
      json = text ? JSON.parse(text) : {};
    } catch (e) {
      return {
        ok: false,
        error: {
          code: 'BRIDGE_INVALID_RESPONSE',
          message: 'Resposta inválida do Bridge',
          httpStatus: response.status,
          _build: BUILD_STAMP
        }
      };
    }

    // SEMANTIC ERROR PRESERVATION - check json.ok===false first
    if (json.ok === false) {
      let semanticCode = json.error || json.error_code || json.code;
      
      // Check detail field for JSON with semantic error
      if (!semanticCode && json.detail && typeof json.detail === 'string') {
        try {
          const detailJson = JSON.parse(json.detail);
          semanticCode = detailJson.error || detailJson.error_code || detailJson.code;
        } catch (e) {}
      }
      
      if (semanticCode) {
        return {
          ok: false,
          error: {
            code: semanticCode,
            message: json.message || json.detail || 'Erro no Bridge',
            detail: json.detail,
            sqlNumber: json.sqlNumber,
            httpStatus: response.status,
            _build: BUILD_STAMP
          }
        };
      }
    }

    // HTTP error fallback (only if no semantic code)
    if (!response.ok) {
      return {
        ok: false,
        error: {
          code: 'BRIDGE_HTTP_ERROR',
          message: `Bridge retornou HTTP ${response.status}`,
          httpStatus: response.status,
          detail: text.slice(0, 200),
          _build: BUILD_STAMP
        }
      };
    }

    return {
      ok: true,
      data: json.data || json,
      _build: BUILD_STAMP
    };
  } catch (error) {
    clearTimeout(timeoutId);
    return {
      ok: false,
      error: {
        code: error.name === 'AbortError' ? 'BRIDGE_TIMEOUT' : 'BRIDGE_NETWORK_ERROR',
        message: `Erro ao chamar Bridge: ${error.message}`,
        httpStatus: error.name === 'AbortError' ? 504 : 503,
        _build: BUILD_STAMP
      }
    };
  }
}

Deno.serve(async (req) => {
  // ABSOLUTE FIRST: Self-test check before ANY processing
  try {
    const rawBody = await req.text();
    if (rawBody.includes('"__selfTest"') && rawBody.includes('true')) {
      return new Response(JSON.stringify({
        ok: true,
        data: {
          self_test: true,
          timestamp: new Date().toISOString()
        },
        _build: BUILD_STAMP
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' }
      });
    }
    
    // Continue with normal flow - parse body again for normal requests
    const body = rawBody ? JSON.parse(rawBody) : {};
    
    if (req.method !== 'POST') {
      return Response.json({ ok: false, error: { code: 'METHOD_NOT_ALLOWED' }, _build: BUILD_STAMP }, { status: 405 });
    }

    const idempotencyKey = String(body?.idempotencyKey ?? '').trim();

    if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 80) {
      return Response.json({ 
        ok: false, 
        error: { code: 'INVALID_IDEMPOTENCY_KEY', message: 'idempotencyKey deve ter 8-80 chars' },
        _build: BUILD_STAMP
      }, { status: 400 });
    }

    const result = await callBridge('/internal/alz/release', { idempotencyKey });
    return Response.json({ ...result, _build: BUILD_STAMP }, { status: 200 });
    
  } catch (e) {
    return Response.json({ 
      ok: false, 
      error: { code: 'INTERNAL_ERROR', message: 'bridgeAlzRelease falhou', detail: String(e?.message || e) },
      _build: BUILD_STAMP
    }, { status: 200 });
  }
});