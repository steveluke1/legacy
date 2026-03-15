import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * bridgeHealth
 * 
 * Chama Bridge GET /health para verificar conectividade e saúde
 * 
 * Output:
 *  { ok: true, data: { bridgeOk: true, baseUrl: string } }
 *  OR
 *  { ok: false, error: { code, message, detail?, status? } }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({
        ok: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Não autorizado',
        },
      }, { status: 401 });
    }

    const bridgeBaseUrl = Deno.env.get('BRIDGE_BASE_URL');
    const bridgeApiKey = Deno.env.get('BRIDGE_API_KEY');

    // Validar configuração
    if (!bridgeBaseUrl || !bridgeApiKey) {
      return Response.json({
        ok: false,
        error: {
          code: 'BRIDGE_NOT_CONFIGURED',
          message: 'Bridge não configurado. BRIDGE_BASE_URL ou BRIDGE_API_KEY ausente.',
        },
      }, { status: 500 });
    }

    // Normalizar URL
    let cleanBase = bridgeBaseUrl.replace(/\/+$/, '');
    if (cleanBase.endsWith('/internal')) {
      cleanBase = cleanBase.slice(0, -9);
    }

    const url = new URL('/health', cleanBase).toString();

    // AbortController para timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse JSON
      let json;
      try {
        const text = await response.text();
        json = text ? JSON.parse(text) : {};
      } catch (parseError) {
        return Response.json({
          ok: false,
          error: {
            code: 'BRIDGE_INVALID_RESPONSE',
            message: 'Resposta inválida do Bridge (não é JSON válido)',
            status: response.status,
          },
        });
      }

      if (!response.ok) {
        return Response.json({
          ok: false,
          error: {
            code: 'BRIDGE_UNREACHABLE',
            message: `Bridge retornou HTTP ${response.status}`,
            detail: JSON.stringify(json).substring(0, 200),
            status: response.status,
          },
        });
      }

      // Bridge health deve retornar { ok: true }
      if (json.ok === true) {
        return Response.json({
          ok: true,
          data: {
            bridgeOk: true,
            baseUrl: cleanBase,
            healthEndpoint: url,
          },
        });
      }

      return Response.json({
        ok: false,
        error: {
          code: 'BRIDGE_HEALTH_FAILED',
          message: 'Bridge health check falhou',
          detail: JSON.stringify(json).substring(0, 200),
        },
      });
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        return Response.json({
          ok: false,
          error: {
            code: 'BRIDGE_TIMEOUT',
            message: 'Timeout ao chamar Bridge /health após 10s',
          },
        });
      }

      return Response.json({
        ok: false,
        error: {
          code: 'BRIDGE_NETWORK_ERROR',
          message: `Erro de rede ao chamar Bridge: ${error.message}`,
        },
      });
    }
  } catch (error) {
    console.error('[bridgeHealth] Error:', error.message);
    return Response.json({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Erro interno',
      },
    }, { status: 500 });
  }
});