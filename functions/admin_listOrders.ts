import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { generateCorrelationId } from './_shared/marketHelpers.js';

Deno.serve(async (req) => {
  const correlationId = generateCorrelationId();
  
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({
        success: false,
        error: 'Não autorizado',
        correlationId
      }, {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
    
    // Buscar ordens
    const filter = status ? { status } : {};
    const skip = (page - 1) * limit;
    const orders = await base44.asServiceRole.entities.AlzOrder.filter(filter, '-created_date', limit, skip);
    
    // Contar total
    const allOrders = await base44.asServiceRole.entities.AlzOrder.filter(filter);
    const total = allOrders.length;
    
    return Response.json({
      success: true,
      orders: orders.map(o => ({
        order_id: o.order_id,
        listing_id: o.listing_id,
        seller_user_id: o.seller_user_id,
        buyer_user_id: o.buyer_user_id,
        buyer_character_name: o.buyer_character_name,
        alz_amount: o.alz_amount,
        price_brl: o.price_brl,
        market_fee_brl: o.market_fee_brl,
        status: o.status,
        created_date: o.created_date,
        paid_at: o.paid_at,
        delivered_at: o.delivered_at,
        correlation_id: o.correlation_id,
        notes: o.notes
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      correlationId,
      notes: {
        source: 'AlzOrder',
        dataQuality: 'ok'
      }
    }, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: 'Erro ao listar ordens',
      correlationId
    }, {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});