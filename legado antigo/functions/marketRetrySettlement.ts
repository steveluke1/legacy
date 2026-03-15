// functions/marketRetrySettlement.js
// Retry settlement for a failed payment (admin-only)

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const correlationId = `retry-settle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const { paymentId } = await req.json();
    
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // ADMIN-ONLY or SYSTEM TOKEN
    const systemToken = Deno.env.get('MARKET_SYSTEM_TOKEN');
    const headerToken = req.headers.get('x-market-system-token');
    
    const isAdmin = user && user.role === 'admin';
    const isSystemAuth = systemToken && headerToken === systemToken;

    if (!isAdmin && !isSystemAuth) {
      return Response.json({
        ok: false,
        error: { code: 'FORBIDDEN', message: 'Somente administradores ou sistema autorizado' }
      }, { status: 403 });
    }

    if (!paymentId) {
      return Response.json({
        ok: false,
        error: { code: 'MISSING_PAYMENT_ID', message: 'paymentId é obrigatório' }
      }, { status: 400 });
    }

    // Load payment
    const payments = await base44.asServiceRole.entities.MarketPixPayment.filter({
      id: paymentId
    }, undefined, 1);

    if (payments.length === 0) {
      return Response.json({
        ok: false,
        error: { code: 'PAYMENT_NOT_FOUND', message: 'Pagamento não encontrado' }
      }, { status: 404 });
    }

    const payment = payments[0];

    // Ensure payment is in failed or paid state (not settled)
    if (payment.status === 'settled') {
      return Response.json({
        ok: false,
        error: {
          code: 'ALREADY_SETTLED',
          message: 'Pagamento já foi liquidado'
        }
      }, { status: 400 });
    }

    if (payment.status !== 'failed' && payment.status !== 'paid') {
      return Response.json({
        ok: false,
        error: {
          code: 'INVALID_STATUS',
          message: `Pagamento está em status '${payment.status}'. Apenas 'failed' ou 'paid' podem ser retried.`
        }
      }, { status: 400 });
    }

    // Reset status to 'paid' to allow settlement retry
    await base44.asServiceRole.entities.MarketPixPayment.update(payment.id, {
      status: 'paid',
      error_message: null // Clear previous error
    });

    console.log(`[marketRetrySettlement:${correlationId}] Payment ${payment.id} reset to 'paid' for retry`);

    // Trigger settlement via marketSettlePayment
    const settlementReq = new Request('http://localhost/api/marketSettlePayment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-market-system-token': systemToken || 'MISSING'
      },
      body: JSON.stringify({ paymentId: payment.id })
    });

    const base44Settlement = createClientFromRequest(settlementReq);
    const settlementRes = await base44Settlement.functions.invoke('marketSettlePayment', {
      paymentId: payment.id
    });

    if (!settlementRes.data?.ok) {
      return Response.json({
        ok: false,
        error: {
          code: 'SETTLEMENT_RETRY_FAILED',
          message: settlementRes.data?.error?.message || 'Falha ao retentar settlement',
          detail: settlementRes.data?.error
        }
      }, { status: 500 });
    }

    return Response.json({
      ok: true,
      data: {
        payment_id: payment.id,
        retry_status: 'success',
        settlement_result: settlementRes.data,
        correlation_id: correlationId
      }
    });

  } catch (error) {
    console.error(`[marketRetrySettlement:${correlationId}] ERROR:`, error);
    
    return Response.json({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro ao retentar settlement',
        detail: error.message
      }
    }, { status: 500 });
  }
});