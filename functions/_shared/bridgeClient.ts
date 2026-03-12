// functions/_shared/bridgeClient.js
// Shared Bridge transport layer for all marketplace/game server integration
// VERSION: 1.0.0 - Canonical implementation

const BUILD_SIGNATURE = 'bridgeClient-v1-20260114';

/**
 * Call Bridge service (game server HTTP interface)
 * @param {string} path - Bridge endpoint path (e.g., "/internal/character/resolve-nic")
 * @param {object} payload - Request body payload
 * @param {string} method - HTTP method (default: 'POST')
 * @param {number} timeoutMs - Request timeout in ms (default: 10000)
 * @param {object} extraHeaders - Additional headers (optional)
 * @returns {Promise<{ok: boolean, data?: any, error?: {code, message, httpStatus?, detail?}, correlation_id: string, build_signature: string}>}
 */
export async function callBridge(path, payload, method = 'POST', timeoutMs = 10000, extraHeaders = {}) {
  const correlationId = `bridge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Get Bridge config from env
  const bridgeBaseUrl = Deno.env.get('BRIDGE_BASE_URL');
  const bridgeApiKey = Deno.env.get('BRIDGE_API_KEY');

  // FAIL-FAST: Missing config
  if (!bridgeBaseUrl || !bridgeApiKey) {
    console.error(`[bridgeClient:${correlationId}] BRIDGE_CONFIG_MISSING baseUrl=${!!bridgeBaseUrl} apiKey=${!!bridgeApiKey}`);
    return {
      ok: false,
      error: {
        code: 'BRIDGE_CONFIG_MISSING',
        message: 'Bridge não configurado',
        detail: 'BRIDGE_BASE_URL ou BRIDGE_API_KEY ausentes',
        next_action: 'CHECK_ENV_VARS'
      },
      correlation_id: correlationId,
      build_signature: BUILD_SIGNATURE
    };
  }

  // Build URL (safe URL joining)
  const cleanBase = bridgeBaseUrl.trim().replace(/\/+$/, '').replace(/\/internal$/, '');
  let url;
  try {
    url = new URL(path.startsWith('/') ? path : `/${path}`, cleanBase).toString();
  } catch (urlError) {
    console.error(`[bridgeClient:${correlationId}] INVALID_URL base=${cleanBase} path=${path}`);
    return {
      ok: false,
      error: {
        code: 'BRIDGE_INVALID_URL',
        message: 'URL do Bridge inválida',
        detail: urlError.message
      },
      correlation_id: correlationId,
      build_signature: BUILD_SIGNATURE
    };
  }

  // Prepare headers
  const authHeader = bridgeApiKey.startsWith('Bearer ') ? bridgeApiKey : `Bearer ${bridgeApiKey}`;
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': authHeader,
    ...extraHeaders
  };

  // Setup timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  console.log(`[bridgeClient:${correlationId}] CALL method=${method} url=${url}`);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: method !== 'GET' ? JSON.stringify(payload) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Parse response
    let text;
    let json;
    try {
      text = await response.text();
      json = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.error(`[bridgeClient:${correlationId}] PARSE_ERROR httpStatus=${response.status} text=${text?.slice(0, 100)}`);
      return {
        ok: false,
        error: {
          code: 'BRIDGE_BAD_RESPONSE',
          message: 'Resposta inválida do Bridge',
          httpStatus: response.status,
          detail: text?.slice(0, 200)
        },
        correlation_id: correlationId,
        build_signature: BUILD_SIGNATURE
      };
    }

    // Map HTTP 404 to deterministic code
    if (response.status === 404) {
      console.warn(`[bridgeClient:${correlationId}] ENDPOINT_NOT_FOUND url=${url}`);
      return {
        ok: false,
        error: {
          code: 'BRIDGE_ENDPOINT_NOT_FOUND',
          message: 'Endpoint do Bridge não encontrado',
          httpStatus: 404,
          detail: `${path} não implementado no Bridge`,
          next_action: 'IMPLEMENT_BRIDGE_ENDPOINT'
        },
        correlation_id: correlationId,
        build_signature: BUILD_SIGNATURE
      };
    }

    // SEMANTIC ERROR PRESERVATION (Bridge returned ok:false)
    if (json.ok === false) {
      let semanticCode = json.error || json.error_code || json.code;
      
      // Try parsing detail field for nested error codes
      if (!semanticCode && json.detail && typeof json.detail === 'string') {
        try {
          const detailJson = JSON.parse(json.detail);
          semanticCode = detailJson.error || detailJson.error_code || detailJson.code;
        } catch (e) {
          // detail is not JSON, ignore
        }
      }
      
      if (semanticCode) {
        console.warn(`[bridgeClient:${correlationId}] SEMANTIC_ERROR code=${semanticCode} httpStatus=${response.status}`);
        return {
          ok: false,
          error: {
            code: semanticCode,
            message: json.message || json.detail || 'Erro no Bridge',
            detail: json.detail,
            sqlNumber: json.sqlNumber,
            httpStatus: response.status
          },
          correlation_id: correlationId,
          build_signature: BUILD_SIGNATURE
        };
      }
    }

    // HTTP error fallback (only if no semantic code was found)
    if (!response.ok) {
      console.error(`[bridgeClient:${correlationId}] HTTP_ERROR status=${response.status} body=${text?.slice(0, 100)}`);
      return {
        ok: false,
        error: {
          code: 'BRIDGE_UPSTREAM_ERROR',
          message: `Bridge retornou HTTP ${response.status}`,
          httpStatus: response.status,
          detail: text?.slice(0, 200)
        },
        correlation_id: correlationId,
        build_signature: BUILD_SIGNATURE
      };
    }

    // SUCCESS
    console.log(`[bridgeClient:${correlationId}] SUCCESS httpStatus=${response.status}`);
    return {
      ok: true,
      data: json.data || json,
      correlation_id: correlationId,
      build_signature: BUILD_SIGNATURE
    };

  } catch (error) {
    clearTimeout(timeoutId);
    
    // Timeout
    if (error.name === 'AbortError') {
      console.error(`[bridgeClient:${correlationId}] TIMEOUT after ${timeoutMs}ms`);
      return {
        ok: false,
        error: {
          code: 'BRIDGE_TIMEOUT',
          message: `Tempo esgotado ao chamar Bridge (${timeoutMs}ms)`,
          httpStatus: 504,
          next_action: 'RETRY_OR_CHECK_BRIDGE'
        },
        correlation_id: correlationId,
        build_signature: BUILD_SIGNATURE
      };
    }
    
    // Network error
    console.error(`[bridgeClient:${correlationId}] NETWORK_ERROR: ${error.message}`);
    return {
      ok: false,
      error: {
        code: 'BRIDGE_NETWORK_ERROR',
        message: `Erro de rede ao chamar Bridge: ${error.message}`,
        httpStatus: 503,
        next_action: 'CHECK_BRIDGE_CONNECTIVITY'
      },
      correlation_id: correlationId,
      build_signature: BUILD_SIGNATURE
    };
  }
}