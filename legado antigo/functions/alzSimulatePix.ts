// functions/alzSimulatePix.js
// TEST MODE ONLY: Simulate PIX payment confirmation
// Triggers webhook ingestion -> settlement -> delivery
// BUILD: alz-simulate-pix-v2-enabled-20260115

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BUILD_STAMP = "alz-simulate-pix-v2-enabled-20260115";

Deno.serve(async (req) => {
  const correlationId = `simulate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const body = await req.json();
    const { __selfTest, debug, token, providerReferenceId } = body;
    const isDebugMode = debug === true;
    
    // SELF-TEST PATH (diagnostic without external dependencies)
    if (__selfTest === true) {
      const testModeEnabled = Deno.env.get('MARKETPLACE_TEST_MODE') === '1';
      const bridgeUrl = Deno.env.get('BRIDGE_BASE_URL') ? 'configured' : 'missing';
      const bridgeKey = Deno.env.get('BRIDGE_API_KEY') ? 'configured' : 'missing';
      
      return Response.json({
        ok: true,
        selfTest: true,
        build_signature: BUILD_STAMP,
        config: {
          test_mode_enabled: testModeEnabled,
          bridge_base_url: bridgeUrl,
          bridge_api_key: bridgeKey
        },
        correlationId
      }, { status: 200 });
    }
    
    // PRODUCTION SAFETY: Block if test mode is disabled
    const testModeEnabled = Deno.env.get('MARKETPLACE_TEST_MODE') === '1';
    
    if (!testModeEnabled) {
      console.warn(`[alzSimulatePix:${correlationId}] BLOCKED - MARKETPLACE_TEST_MODE not enabled`);
      return Response.json({
        ok: false,
        error: {
          code: 'TEST_MODE_DISABLED',
          message: 'Simulação de pagamento disponível apenas em modo de teste. Ative MARKETPLACE_TEST_MODE=1.'
        },
        _build: BUILD_STAMP
      }, { status: 403 });
    }
    
    if (!providerReferenceId || typeof providerReferenceId !== 'string') {
      return Response.json({
        ok: false,
        error: {
          code: 'MISSING_REFERENCE',
          message: 'providerReferenceId (txid) é obrigatório'
        },
        _build: BUILD_STAMP
      }, { status: 400 });
    }
    
    // Auth required via custom JWT
    if (!token || typeof token !== 'string') {
      return Response.json({
        ok: false,
        error: {
          code: 'AUTH_TOKEN_MISSING',
          message: 'Sessão expirada. Faça login novamente.'
        },
        _build: BUILD_STAMP
      }, { status: 401 });
    }
    
    const base44 = createClientFromRequest(req);
    
    // Verify token via auth_me
    const authRes = await base44.functions.invoke('auth_me', { token });
    
    if (!authRes.data?.success || !authRes.data?.user) {
      return Response.json({
        ok: false,
        error: {
          code: 'AUTH_TOKEN_INVALID',
          message: 'Sessão inválida. Faça login novamente.'
        },
        _build: BUILD_STAMP
      }, { status: 401 });
    }
    
    const callerUserId = authRes.data.user.id;
    
    // Find payment by efi_txid
    const payments = await base44.asServiceRole.entities.MarketPixPayment.filter({
      efi_txid: providerReferenceId
    }, undefined, 1);
    
    if (payments.length === 0) {
      return Response.json({
        ok: false,
        error: {
          code: 'PAYMENT_NOT_FOUND',
          message: `Pagamento não encontrado para txid=${providerReferenceId.substring(0, 8)}...`
        },
        _build: BUILD_STAMP
      }, { status: 404 });
    }
    
    const payment = payments[0];
    
    // OWNERSHIP CHECK: Only buyer can simulate their own payment
    if (payment.buyer_user_id !== callerUserId) {
      return Response.json({
        ok: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Você só pode simular pagamentos das suas próprias compras'
        },
        _build: BUILD_STAMP
      }, { status: 403 });
    }
    
    // Idempotency check
    if (payment.status === 'paid' || payment.status === 'settling' || payment.status === 'settled') {
      console.log(`[alzSimulatePix:${correlationId}] ALREADY_PROCESSED payment=${payment.id} status=${payment.status}`);
      
      return Response.json({
        ok: true,
        data: {
          simulated: false,
          idempotent: true,
          payment_id: payment.id,
          status: payment.status,
          message: `Pagamento já processado (status: ${payment.status})`
        },
        _build: BUILD_STAMP,
        correlation_id: correlationId
      });
    }
    
    console.log(`[alzSimulatePix:${correlationId}] SIMULATING payment=${payment.id} buyer=${callerUserId}`);
    
    // Call marketSettlePayment in simulate mode (deterministic, buyer-owned)
    let settleRes;
    try {
      settleRes = await base44.functions.invoke('marketSettlePayment', {
        token,
        paymentId: payment.id,
        simulate: true,
        debug
      });
    } catch (invokeError) {
      // Handle invoke error (e.g., AxiosError with status code)
      const errorStatus = invokeError.response?.status || 500;
      const errorBody = invokeError.response?.data || invokeError.message;
      const bodySnippet = typeof errorBody === 'string' 
        ? errorBody.substring(0, 400)
        : JSON.stringify(errorBody).substring(0, 400);
      
      console.error(`[alzSimulatePix:${correlationId}] INVOKE_ERROR marketSettlePayment status=${errorStatus}:`, invokeError.message);
      
      const downstreamError = {
        ok: false,
        error: {
          code: `DOWNSTREAM_HTTP_${errorStatus}`,
          message: `Erro ao processar settlement (HTTP ${errorStatus})`,
          detail: bodySnippet
        },
        downstream: {
          source: 'marketSettlePayment',
          httpStatus: errorStatus,
          bodySnippet
        },
        _build: BUILD_STAMP,
        correlation_id: correlationId
      };
      
      if (isDebugMode) {
        downstreamError.debug = {
          invokeErrorMessage: invokeError.message,
          responseStatus: errorStatus,
          responseBody: errorBody
        };
      }
      
      return Response.json(downstreamError, { status: 422 });
    }
    
    if (!settleRes.data?.ok) {
      const settlementError = settleRes.data?.error || { code: 'UNKNOWN_SETTLEMENT_ERROR', message: 'Settlement failed' };
      console.error(`[alzSimulatePix:${correlationId}] SETTLEMENT_FAILED payment=${payment.id}:`, settlementError);
      
      const errorResponse = {
        ok: false,
        error: {
          code: settlementError.code || 'SETTLEMENT_FAILED',
          message: settlementError.message || 'Falha ao processar settlement simulado'
        },
        downstream: {
          source: 'marketSettlePayment',
          httpStatus: settleRes.status || 422,
          bodySnippet: JSON.stringify(settleRes.data?.error).substring(0, 400)
        },
        _build: BUILD_STAMP,
        correlation_id: correlationId
      };
      
      // Include bridge proof in debug mode
      if (isDebugMode && settleRes.data?.data?.bridge) {
        errorResponse.debug = {
          bridge: settleRes.data.data.bridge,
          settledOrders: settleRes.data.data.settledOrders,
          meta: settleRes.data.data.meta,
          fullError: settleRes.data?.error
        };
      }
      
      return Response.json(errorResponse, { status: 422 });
    }
    
    const settleData = settleRes.data?.data || {};
    
    console.log(`[alzSimulatePix:${correlationId}] SUCCESS payment=${payment.id} settled=${settleData.settled} deliveredAlz=${settleData.deliveredAlzAmount || payment.alz_amount}`);
    
    // Build response with full proof
    const responseData = {
      simulated: true,
      payment_id: payment.id,
      settled: settleData.settled === true,
      delivered_alz_amount: settleData.deliveredAlzAmount || payment.alz_amount,
      buyer_nic: settleData.buyer_nic || payment.buyer_nic,
      buyer_character_idx: settleData.buyer_character_idx || payment.buyer_character_idx,
      settled_orders: settleData.settledOrders,
      bridge_called: settleData.bridge?.called === true,
      message: 'Pagamento PIX simulado com sucesso!'
    };
    
    // Forward full debug metadata if present
    if (isDebugMode && settleData.bridge) {
      responseData.bridge = settleData.bridge;
      responseData.meta = settleData.meta;
    }
    
    return Response.json({
      ok: true,
      data: responseData,
      _build: BUILD_STAMP,
      correlation_id: correlationId
    });
    
  } catch (error) {
    console.error(`[alzSimulatePix:${correlationId}] UNCAUGHT_ERROR:`, error);
    
    // CRITICAL: If it's an axios-style error with a response, it's likely a downstream 400
    const statusCode = error.response?.status || 500;
    const errorBody = error.response?.data || error.message;
    const bodySnippet = typeof errorBody === 'string'
      ? errorBody.substring(0, 400)
      : JSON.stringify(errorBody).substring(0, 400);
    
    // Map uncaught errors with status codes to 422
    const responseStatus = (statusCode >= 400 && statusCode < 500) ? 422 : 500;
    
    return Response.json({
      ok: false,
      error: {
        code: statusCode === 500 ? 'INTERNAL_ERROR' : `UNCAUGHT_HTTP_${statusCode}`,
        message: 'Erro ao simular pagamento',
        detail: bodySnippet
      },
      downstream: statusCode !== 500 ? {
        source: 'unknown',
        httpStatus: statusCode,
        bodySnippet
      } : undefined,
      _build: BUILD_STAMP
    }, { status: responseStatus });
  }
});