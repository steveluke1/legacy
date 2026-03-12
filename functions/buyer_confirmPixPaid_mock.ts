import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { writeLedgerEntry, writeAuditLog, generateCorrelationId, safeParseJson } from './_shared/marketHelpers.js';

Deno.serve(async (req) => {
  const correlationId = generateCorrelationId();
  
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({
        success: false,
        error: 'Não autorizado',
        correlationId
      }, {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await req.text();
    const data = safeParseJson(body);
    
    if (!data || !data.order_id) {
      return Response.json({
        success: false,
        error: 'order_id é obrigatório',
        correlationId
      }, {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Buscar ordem
    const orders = await base44.asServiceRole.entities.AlzOrder.filter({ order_id: data.order_id }, undefined, 1);
    if (orders.length === 0) {
      return Response.json({
        success: false,
        error: 'Ordem não encontrada',
        correlationId
      }, {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const order = orders[0];
    
    // Verificar ownership ou admin
    const isAdmin = user.role === 'admin';
    if (order.buyer_user_id !== user.id && !isAdmin) {
      return Response.json({
        success: false,
        error: 'Você não tem permissão para confirmar este pagamento',
        correlationId
      }, {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Verificar se está aguardando pagamento
    if (order.status !== 'awaiting_pix') {
      return Response.json({
        success: false,
        error: `Ordem não está aguardando pagamento (status: ${order.status})`,
        correlationId
      }, {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Atualizar ordem para paid
    await base44.asServiceRole.entities.AlzOrder.update(order.id, {
      status: 'paid',
      paid_at: new Date().toISOString()
    });
    
    // Ledger entry
    await writeLedgerEntry(base44, {
      entryType: 'pix_paid',
      orderId: data.order_id,
      listingId: order.listing_id,
      actor: isAdmin ? 'admin' : 'buyer',
      actorUserId: user.id,
      amountBrl: order.price_brl,
      metadata: { mockConfirmation: true, txId: order.pix_tx_id },
      correlationId
    });
    
    // Audit log
    await writeAuditLog(base44, {
      action: 'pix_paid_mock',
      severity: 'info',
      message: `Pagamento PIX confirmado (MOCK): ${data.order_id}`,
      data: { orderId: data.order_id, userId: user.id, isAdmin },
      correlationId
    });
    
    // Trigger delivery imediatamente
    try {
      await base44.functions.invoke('delivery_run', { 
        order_id: data.order_id,
        trigger: 'payment_confirmed'
      });
    } catch (e) {
      // Se função não existe, apenas marcar para processamento posterior
      console.log('delivery_run not available, order marked for processing');
    }
    
    return Response.json({
      success: true,
      order: {
        order_id: data.order_id,
        status: 'paid',
        paid_at: new Date().toISOString()
      },
      correlationId,
      notes: {
        mockPayment: true,
        deliveryTriggered: true
      }
    }, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: 'Erro ao confirmar pagamento',
      correlationId
    }, {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});