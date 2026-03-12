// functions/marketBridgeProbe.js
// Self-contained Bridge connectivity probe for marketplace diagnostics
// VERSION: v1-safe-probe-20260115

const BUILD_SIGNATURE = 'marketBridgeProbe-v1-20260115';

// SELF-CONTAINED callBridge (no local imports)
async function callBridge(endpoint, payload, timeoutMs = 8000) {
  const bridgeBaseUrl = Deno.env.get('BRIDGE_BASE_URL');
  const bridgeApiKey = Deno.env.get('BRIDGE_API_KEY');

  if (!bridgeBaseUrl || !bridgeApiKey) {
    return {
      ok: false,
      error: {
        code: 'BRIDGE_CONFIG_MISSING',
        message: 'Bridge não configurado',
        httpStatus: 500
      }
    };
  }

  // Build URL (safe joining)
  const cleanBase = bridgeBaseUrl.trim().replace(/\/+$/, '');
  let url;
  try {
    url = new URL(endpoint.startsWith('/') ? endpoint : `/${endpoint}`, cleanBase).toString();
  } catch (urlError) {
    return {
      ok: false,
      error: {
        code: 'BRIDGE_INVALID_URL',
        message: 'URL do Bridge inválida',
        httpStatus: 500
      }
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${bridgeApiKey}`
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Capture response metadata
    const contentType = response.headers.get('content-type') || 'unknown';
    const httpStatus = response.status;

    let text;
    let json;
    try {
      text = await response.text();
      json = text ? JSON.parse(text) : {};
    } catch (parseError) {
      // Non-JSON response (e.g., Cloudflare error page)
      const snippet = text ? text.slice(0, 220) : '';
      
      return {
        ok: false,
        error: {
          code: 'BRIDGE_BAD_RESPONSE',
          message: 'Resposta inválida do Bridge',
          httpStatus,
          detail: {
            httpStatus,
            contentType,
            snippet
          }
        }
      };
    }

    // Map HTTP 404
    if (response.status === 404) {
      return {
        ok: false,
        error: {
          code: 'BRIDGE_ENDPOINT_NOT_FOUND',
          message: 'Endpoint do Bridge não encontrado',
          httpStatus: 404
        }
      };
    }

    // Semantic error preservation
    if (json.ok === false) {
      const semanticCode = json.error || json.error_code || json.code;
      if (semanticCode) {
        return {
          ok: false,
          error: {
            code: semanticCode,
            message: json.message || json.detail || 'Erro no Bridge',
            httpStatus: response.status
          }
        };
      }
    }

    // HTTP error fallback
    if (!response.ok) {
      return {
        ok: false,
        error: {
          code: 'BRIDGE_UPSTREAM_ERROR',
          message: `Bridge retornou HTTP ${response.status}`,
          httpStatus: response.status
        }
      };
    }

    // SUCCESS
    return {
      ok: true,
      data: json.data || json
    };

  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      return {
        ok: false,
        error: {
          code: 'BRIDGE_TIMEOUT',
          message: 'Tempo esgotado ao chamar Bridge',
          httpStatus: 504
        }
      };
    }
    
    return {
      ok: false,
      error: {
        code: 'BRIDGE_NETWORK_ERROR',
        message: `Erro de rede ao chamar Bridge: ${error.message}`,
        httpStatus: 503
      }
    };
  }
}

Deno.serve(async (req) => {
  const correlationId = `bridge-probe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[marketBridgeProbe:${correlationId}] START`);
  
  try {
    // Get config (safe exposure)
    const bridgeBaseUrl = Deno.env.get('BRIDGE_BASE_URL');
    const bridgeApiKey = Deno.env.get('BRIDGE_API_KEY');
    
    const hasBaseUrl = !!bridgeBaseUrl;
    const hasApiKey = !!bridgeApiKey;
    
    // Extract host only (no secrets)
    let baseHost = null;
    if (bridgeBaseUrl) {
      try {
        const urlObj = new URL(bridgeBaseUrl);
        baseHost = urlObj.host;
      } catch {
        baseHost = 'INVALID_URL';
      }
    }
    
    const config = {
      hasBaseUrl,
      hasApiKey,
      baseHost
    };
    
    // PROBE 1: Resolve NIC (fake NIC, no PII)
    console.log(`[marketBridgeProbe:${correlationId}] PROBE_1 resolve-nic`);
    const resolveNicProbe = await callBridge('/internal/character/resolve-nic', {
      nic: '__PROBE_DO_NOT_USE__'
    });
    
    // PROBE 2: ALZ Lock (amount=0, no side effects)
    console.log(`[marketBridgeProbe:${correlationId}] PROBE_2 alz-lock`);
    const alzLockProbe = await callBridge('/internal/alz/lock', {
      sellerUserNum: 0,
      amount: '0',
      idempotencyKey: 'probe:0',
      escrowUserNum: 0
    });
    
    console.log(`[marketBridgeProbe:${correlationId}] SUCCESS`);
    
    return Response.json({
      ok: true,
      data: {
        config,
        probes: {
          resolveNic: resolveNicProbe,
          alzLock: alzLockProbe
        }
      },
      correlation_id: correlationId,
      build_signature: BUILD_SIGNATURE
    }, { status: 200 });
    
  } catch (error) {
    console.error(`[marketBridgeProbe:${correlationId}] CRITICAL_ERROR:`, error.message);
    
    return Response.json({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro ao executar probe',
        detail: error.message
      },
      correlation_id: correlationId,
      build_signature: BUILD_SIGNATURE
    }, { status: 500 });
  }
});