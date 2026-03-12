// functions/marketGetPixPaymentStatus.js
// Lightweight status check for Pix payment polling

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const { paymentId } = await req.json();

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({
        ok: false,
        error: { code: 'UNAUTHORIZED', message: 'Não autorizado' }
      }, { status: 401 });
    }

    if (!paymentId) {
      return Response.json({
        ok: false,
        error: { code: 'MISSING_PAYMENT_ID', message: 'paymentId é obrigatório' }
      }, { status: 400 });
    }

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

    // Authorization: only buyer can check status
    if (payment.buyer_user_id !== user.id) {
      return Response.json({
        ok: false,
        error: { code: 'FORBIDDEN', message: 'Acesso negado' }
      }, { status: 403 });
    }

    return Response.json({
      ok: true,
      status: payment.status,
      paymentId: payment.id,
      txid: payment.efi_txid,
      settledAt: payment.settled_at,
      createdAt: payment.created_date
    });

  } catch (error) {
    console.error('[marketGetPixPaymentStatus] ERROR:', error);
    return Response.json({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro ao buscar status do pagamento'
      }
    }, { status: 500 });
  }
});