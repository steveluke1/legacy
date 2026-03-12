// functions/bridgeProbeEndpoints.js
// Diagnostic probe for Bridge ALZ endpoints (settle + lock)
// VERSION: 1.0.0 - NO AUTH REQUIRED (diagnostic only)

const BUILD_STAMP = "bridgeProbeEndpoints-v1";

async function probeEndpoint(baseUrl, path, apiKey, timeoutMs = 5000) {
  let url;
  try {
    const cleanBase = baseUrl.trim().replace(/\/+$/, '').replace(/\/internal$/, '');
    url = new URL(path.startsWith('/') ? path : `/${path}`, cleanBase).toString();
  } catch (e) {
    return {
      path,
      status: 'INVALID_URL',
      error: e.message,
      url: null
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Try OPTIONS first (least intrusive, no body required)
    const optionsResponse = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        'x-bridge-api-key': apiKey,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // If OPTIONS returns 405 Method Not Allowed, endpoint exists but doesn't allow OPTIONS
    // This is GOOD - means the endpoint is there
    if (optionsResponse.status === 405) {
      return {
        path,
        url,
        status: 'REACHABLE',
        method: 'OPTIONS',
        http_status: 405,
        note: 'Endpoint existe mas não aceita OPTIONS (normal)'
      };
    }

    // If OPTIONS succeeds (200/204), endpoint exists and accepts OPTIONS
    if (optionsResponse.ok) {
      return {
        path,
        url,
        status: 'REACHABLE',
        method: 'OPTIONS',
        http_status: optionsResponse.status,
        note: 'Endpoint aceita OPTIONS'
      };
    }

    // If OPTIONS returns 404, endpoint does NOT exist
    if (optionsResponse.status === 404) {
      return {
        path,
        url,
        status: 'NOT_FOUND',
        method: 'OPTIONS',
        http_status: 404,
        note: 'Endpoint não encontrado (404)'
      };
    }

    // Other status codes (401, 403, 500, etc.)
    return {
      path,
      url,
      status: 'ERROR',
      method: 'OPTIONS',
      http_status: optionsResponse.status,
      note: `HTTP ${optionsResponse.status}`
    };

  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      return {
        path,
        url,
        status: 'TIMEOUT',
        method: 'OPTIONS',
        note: 'Timeout após 5s'
      };
    }

    return {
      path,
      url,
      status: 'NETWORK_ERROR',
      method: 'OPTIONS',
      error: error.message
    };
  }
}

Deno.serve(async (req) => {
  try {
    const rawBody = await req.text();
    const body = rawBody ? JSON.parse(rawBody) : {};

    // Self-test returns config + probe results
    const isSelfTest = body.__selfTest === true;

    const bridgeBaseUrl = Deno.env.get('BRIDGE_BASE_URL');
    const bridgeApiKey = Deno.env.get('BRIDGE_API_KEY');
    const settlePath = Deno.env.get('BRIDGE_ALZ_SETTLE_PATH') || '/internal/alz/settle';
    const lockPath = Deno.env.get('BRIDGE_ALZ_LOCK_PATH') || '/internal/alz/lock';

    if (!bridgeBaseUrl || !bridgeApiKey) {
      return Response.json({
        ok: false,
        error: {
          code: 'BRIDGE_NOT_CONFIGURED',
          message: 'Bridge não configurado (BRIDGE_BASE_URL ou BRIDGE_API_KEY ausente)',
          detail: {
            has_base_url: !!bridgeBaseUrl,
            has_api_key: !!bridgeApiKey
          }
        },
        _build: BUILD_STAMP
      }, { status: 500 });
    }

    // Probe both endpoints
    const [settleProbe, lockProbe] = await Promise.all([
      probeEndpoint(bridgeBaseUrl, settlePath, bridgeApiKey),
      probeEndpoint(bridgeBaseUrl, lockPath, bridgeApiKey)
    ]);

    const data = {
      timestamp: new Date().toISOString(),
      config: {
        base_url: bridgeBaseUrl,
        settle_path: settlePath,
        lock_path: lockPath,
        settle_path_source: Deno.env.get('BRIDGE_ALZ_SETTLE_PATH') ? 'ENV' : 'DEFAULT',
        lock_path_source: Deno.env.get('BRIDGE_ALZ_LOCK_PATH') ? 'ENV' : 'DEFAULT'
      },
      probes: {
        settle: settleProbe,
        lock: lockProbe
      }
    };

    if (isSelfTest) {
      data.self_test = true;
    }

    return Response.json({
      ok: true,
      data,
      _build: BUILD_STAMP
    }, { status: 200 });

  } catch (e) {
    return Response.json({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro ao executar probe',
        detail: String(e?.message || e)
      },
      _build: BUILD_STAMP
    }, { status: 200 });
  }
});