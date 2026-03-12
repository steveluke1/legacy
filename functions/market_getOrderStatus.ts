// functions/market_getOrderStatus.js
// Get order status and timeline (requires auth)
// BUILD: market-get-order-status-v1-20260115

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BUILD_STAMP = "market-get-order-status-v1-20260115";

Deno.serve(async (req) => {
  const correlationId = `order-status-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const base44 = createClientFromRequest(req);
    
    const body = await req.json().catch(() => ({}));
    const { token, order_id } = body;
    
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
    
    if (!order_id) {
      return Response.json({
        ok: false,
        error: {
          code: 'MISSING_ORDER_ID',
          message: 'order_id é obrigatório'
        },
        _build: BUILD_STAMP
      }, { status: 400 });
    }
    
    // Fetch payment (payment.id = order_id in current schema)
    const payments = await base44.asServiceRole.entities.MarketPixPayment.filter(
      { id: order_id },
      undefined,
      1
    );
    
    if (payments.length === 0) {
      return Response.json({
        ok: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Pedido não encontrado'
        },
        _build: BUILD_STAMP
      }, { status: 404 });
    }
    
    const payment = payments[0];
    
    // Verify ownership (buyer only for now; could extend to seller later)
    if (payment.buyer_user_id !== callerUserId) {
      return Response.json({
        ok: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Você só pode visualizar seus próprios pedidos'
        },
        _build: BUILD_STAMP
      }, { status: 403 });
    }
    
    // Build timeline from status transitions
    const timeline = [];
    
    if (payment.created_date) {
      timeline.push({
        status: 'created',
        timestamp: payment.created_date,
        label: 'Pedido criado'
      });
    }
    
    if (payment.status === 'paid' || payment.status === 'settling' || payment.status === 'settled') {
      timeline.push({
        status: 'paid',
        timestamp: payment.updated_date,
        label: 'Pagamento confirmado'
      });
    }
    
    if (payment.status === 'settling') {
      timeline.push({
        status: 'settling',
        timestamp: payment.settling_at || payment.updated_date,
        label: 'Processando entrega'
      });
    }
    
    if (payment.status === 'settled') {
      timeline.push({
        status: 'settled',
        timestamp: payment.settled_at || payment.updated_date,
        label: 'ALZ entregue'
      });
    }
    
    if (payment.status === 'failed') {
      timeline.push({
        status: 'failed',
        timestamp: payment.updated_date,
        label: `Falha: ${payment.error_message || 'Erro desconhecido'}`
      });
    }
    
    // Map order structure for UI compatibility
    const order = {
      order_id: payment.id,
      status: payment.status,
      alz_amount: parseFloat(payment.alz_amount || '0'),
      price_brl: payment.total_brl_cents / 100,
      buyer_character_name: payment.buyer_nic,
      character_nick: payment.buyer_nic,
      created_date: payment.created_date,
      paid_at: payment.status === 'paid' ? payment.updated_date : null,
      delivered_at: payment.settled_at || null
    };
    
    return Response.json({
      success: true,
      order,
      timeline,
      _build: BUILD_STAMP,
      correlation_id: correlationId
    });
    
  } catch (error) {
    console.error(`[market_getOrderStatus:${correlationId}] ERROR:`, error);
    return Response.json({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro ao buscar status do pedido',
        detail: error.message
      },
      _build: BUILD_STAMP
    }, { status: 500 });
  }
});