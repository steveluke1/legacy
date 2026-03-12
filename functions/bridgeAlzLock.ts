// functions/bridgeAlzLock.js
// Calls Bridge: POST /internal/alz/lock
// VERSION: 6.0.0 - INLINED callBridge (no local imports due to platform limitations)

const BUILD_STAMP = "bridgeAlzLock-v6-inline";

// Inlined callBridge (no imports to avoid deploy 404)
async function callBridge(endpoint, payload, method = 'POST') {
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
  let url;
  try {
    url = new URL(endpoint.startsWith('/') ? endpoint : `/${endpoint}`, cleanBase).toString();
  } catch (e) {
    return {
      ok: false,
      error: {
        code: 'BRIDGE_INVALID_URL',
        message: 'URL do Bridge inválida',
        detail: { baseUrl: cleanBase, endpoint, error: e.message },
        _build: BUILD_STAMP
      }
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-bridge-api-key': bridgeApiKey,
      },
      body: method !== 'GET' && method !== 'OPTIONS' ? JSON.stringify(payload) : undefined,
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
      // Special handling for 404: endpoint not found
      if (response.status === 404) {
        return {
          ok: false,
          error: {
            code: 'BRIDGE_ENDPOINT_NOT_FOUND',
            message: 'Endpoint do Bridge não encontrado',
            httpStatus: 404,
            detail: {
              attempted_url: url,
              method,
              hint: 'Verifique se BRIDGE_ALZ_LOCK_PATH está configurado corretamente',
              response_snippet: text.slice(0, 200)
            },
            _build: BUILD_STAMP
          }
        };
      }
      
      return {
        ok: false,
        error: {
          code: 'BRIDGE_HTTP_ERROR',
          message: `Bridge retornou HTTP ${response.status}`,
          httpStatus: response.status,
          detail: {
            attempted_url: url,
            method,
            response_snippet: text.slice(0, 200)
          },
          _build: BUILD_STAMP
        }
      };
    }

    return {
      ok: true,
      data: json.data || json,
      proof: {
        attempted_url: url,
        method,
        http_status: response.status
      },
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
        detail: {
          attempted_url: url,
          method
        },
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

    const sellerUserNum = toInt(body?.sellerUserNum);
    const amountStr = String(body?.amount ?? '').trim();
    const idempotencyKey = String(body?.idempotencyKey ?? '').trim();
    
    // Read escrow from environment (NEVER hardcode)
    const escrowUserNumEnv = toInt(Deno.env.get('ESCROW_USERNUM'));

    // Validate inputs
    if (!sellerUserNum || sellerUserNum <= 0) {
      return Response.json({ 
        ok: false, 
        error: { code: 'INVALID_SELLER_USERNUM', message: 'sellerUserNum deve ser inteiro > 0' },
        _build: BUILD_STAMP
      }, { status: 400 });
    }

    // amount MUST be integer numeric string (bigint)
    if (!/^\d+$/.test(amountStr)) {
      return Response.json({ 
        ok: false, 
        error: { code: 'INVALID_AMOUNT', message: 'amount deve ser string numérica inteira (ex: "20000000000")' },
        _build: BUILD_STAMP
      }, { status: 400 });
    }

    const amount = BigInt(amountStr);
    const BIGINT_MAX = 9223372036854775807n;
    if (amount <= 0n || amount > BIGINT_MAX) {
      return Response.json({ 
        ok: false, 
        error: { code: 'INVALID_AMOUNT', message: 'amount fora do range do SQL bigint' },
        _build: BUILD_STAMP
      }, { status: 400 });
    }

    if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 80) {
      return Response.json({ 
        ok: false, 
        error: { code: 'INVALID_IDEMPOTENCY_KEY', message: 'idempotencyKey deve ter 8-80 chars' },
        _build: BUILD_STAMP
      }, { status: 400 });
    }

    // Validate ESCROW_USERNUM from environment
    if (!escrowUserNumEnv || escrowUserNumEnv <= 0) {
      return Response.json({ 
        ok: false, 
        error: { code: 'BRIDGE_NOT_CONFIGURED', message: 'ESCROW_USERNUM ausente ou inválido' },
        _build: BUILD_STAMP
      }, { status: 500 });
    }

    // Allow override via ENV for lock path
    const lockPath = Deno.env.get('BRIDGE_ALZ_LOCK_PATH') || '/internal/alz/lock';
    
    const result = await callBridge(lockPath, {
      sellerUserNum,
      amount: amountStr,
      idempotencyKey,
      escrowUserNum: escrowUserNumEnv,
    });

    return Response.json({ ...result, _build: BUILD_STAMP }, { status: 200 });
    
  } catch (e) {
    return Response.json({ 
      ok: false, 
      error: { code: 'INTERNAL_ERROR', message: 'bridgeAlzLock falhou', detail: String(e?.message || e) },
      _build: BUILD_STAMP
    }, { status: 200 });
  }
});

function toInt(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.trunc(n);
}