// functions/market_getMyOrders.js
// Get buyer's ALZ purchase orders (requires auth)
// BUILD: market-get-my-orders-v1-20260115

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BUILD_STAMP = "market-get-my-orders-v1-20260115";

Deno.serve(async (req) => {
  const correlationId = `get-orders-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const base44 = createClientFromRequest(req);
    
    const body = await req.json().catch(() => ({}));
    const { token } = body;
    
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
    
    // Fetch MarketPixPayment records for this buyer
    const payments = await base44.asServiceRole.entities.MarketPixPayment.filter(
      { buyer_user_id: callerUserId },
      '-created_date',
      50
    );
    
    // Map to order-like structure (compatible with existing UI)
    const orders = payments.map(p => ({
      order_id: p.id,
      alz_amount: parseFloat(p.alz_amount || '0'),
      price_brl: p.total_brl_cents / 100,
      buyer_character_name: p.buyer_nic,
      status: p.status,
      created_date: p.created_date,
      delivered_at: p.settled_at || null
    }));
    
    return Response.json({
      success: true,
      orders,
      _build: BUILD_STAMP,
      correlation_id: correlationId
    });
    
  } catch (error) {
    console.error(`[market_getMyOrders:${correlationId}] ERROR:`, error);
    return Response.json({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro ao buscar pedidos',
        detail: error.message
      },
      _build: BUILD_STAMP
    }, { status: 500 });
  }
});