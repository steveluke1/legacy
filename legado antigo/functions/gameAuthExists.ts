import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BUILD_SIGNATURE = 'game-auth-exists-20260106-v1';

/**
 * Check if a login ID exists in the game database via Bridge Service
 * Used for: username availability check during registration
 */

Deno.serve(async (req) => {
  const correlationId = crypto.randomUUID();
  
  try {
    console.log(`[gameAuthExists:${correlationId}] stage=START build=${BUILD_SIGNATURE}`);
    
    if (req.method !== 'POST') {
      return Response.json({
        ok: false,
        error: { code: 'METHOD_NOT_ALLOWED', message: 'Método não permitido' }
      }, { status: 405 });
    }
    
    const base44 = createClientFromRequest(req);
    
    const body = await req.json();
    const loginIdRaw = body.loginId ?? body.login_id;
    
    // Validation: loginId required
    if (!loginIdRaw || typeof loginIdRaw !== 'string') {
      console.log(`[gameAuthExists:${correlationId}] stage=VALIDATE status=400 reason=MISSING_LOGIN_ID`);
      return Response.json({
        ok: false,
        error: { code: 'MISSING_LOGIN_ID', message: 'ID de login é obrigatório' }
      }, { status: 400 });
    }
    
    // Trim and normalize
    const loginId = loginIdRaw.trim().toLowerCase();
    
    // Validate length: Bridge/SP requires 1-32 chars
    if (loginId.length < 1 || loginId.length > 32) {
      console.log(`[gameAuthExists:${correlationId}] stage=VALIDATE status=400 reason=INVALID_LENGTH len=${loginId.length}`);
      return Response.json({
        ok: false,
        error: { code: 'INVALID_LENGTH', message: 'ID de login deve ter entre 1 e 32 caracteres' }
      }, { status: 400 });
    }
    
    // Get Bridge config
    const bridgeBaseUrl = Deno.env.get('BRIDGE_BASE_URL');
    const bridgeApiKey = Deno.env.get('BRIDGE_API_KEY');
    
    if (!bridgeBaseUrl || !bridgeApiKey) {
      console.error(`[gameAuthExists:${correlationId}] stage=CONFIG_ERROR`);
      return Response.json({
        ok: false,
        error: { code: 'SERVER_CONFIG_ERROR', message: 'Configuração do servidor inválida' }
      }, { status: 500 });
    }
    
    // Call Bridge /internal/auth/exists
    console.log(`[gameAuthExists:${correlationId}] stage=BRIDGE_CALL loginId=${loginId.substring(0,3)}***`);
    
    let bridgeResponse;
    try {
      const response = await fetch(`${bridgeBaseUrl}/internal/auth/exists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${bridgeApiKey}`
        },
        body: JSON.stringify({ loginId })
      });
      
      if (!response.ok) {
        console.error(`[gameAuthExists:${correlationId}] stage=BRIDGE_HTTP_ERROR status=${response.status}`);
        return Response.json({
          ok: false,
          error: { code: 'BRIDGE_UNAVAILABLE', message: 'Serviço de autenticação temporariamente indisponível' }
        }, { status: 503 });
      }
      
      bridgeResponse = await response.json();
    } catch (fetchError) {
      console.error(`[gameAuthExists:${correlationId}] stage=BRIDGE_FETCH_ERROR error=${fetchError.message}`);
      return Response.json({
        ok: false,
        error: { code: 'BRIDGE_UNAVAILABLE', message: 'Serviço de autenticação temporariamente indisponível' }
      }, { status: 503 });
    }
    
    console.log(`[gameAuthExists:${correlationId}] stage=SUCCESS exists=${bridgeResponse.exists}`);
    
    return Response.json({
      ok: true,
      data: {
        exists: bridgeResponse.exists,
        userNum: bridgeResponse.userNum
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error(`[gameAuthExists:${correlationId}] stage=FATAL_ERROR error=${error.message}`);
    return Response.json({
      ok: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erro interno do servidor' }
    }, { status: 500 });
  }
});