import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const VIP_PLANS = {
  'VIP_SIMPLE': { name: 'VIP Cristal', price_brl: 35, duration_days: 30 },
  'VIP_MEDIUM': { name: 'VIP Platina Ziron', price_brl: 60, duration_days: 30 },
  'VIP_COMPLETE': { name: 'VIP Myth Ziron', price_brl: 90, duration_days: 30 }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const { plan_key } = await req.json();
    const plan = VIP_PLANS[plan_key];

    if (!plan) {
      return Response.json({ 
        success: false,
        error: 'Plano inválido' 
      }, { status: 400 });
    }

    // IDEMPOTENCY: Generate or use provided key
    const orderId = crypto.randomUUID();
    const idempotencyKey = `premium_brl_${user.id}_${plan_key}_${Date.now()}`;

    // Check for recent pending/paid orders for same user+plan (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const recentOrders = await base44.asServiceRole.entities.StoreOrder.filter({
      buyer_user_id: user.id,
      item_sku: plan_key,
      payment_method: 'BRL'
    });

    const recentPending = recentOrders.find(o => 
      o.created_date > fiveMinutesAgo && 
      (o.status === 'pending' || o.status === 'paid')
    );

    if (recentPending) {
      // Return existing order to prevent duplicate payment creation
      return Response.json({
        success: true,
        transaction_id: recentPending.payment_transaction_id,
        order_id: recentPending.order_id,
        payment_url: `/minha-conta/premium?payment_pending=${recentPending.payment_transaction_id}`,
        summary: `Você já possui um pedido ativo para ${plan.name} (R$ ${plan.price_brl.toFixed(2)}).`,
        alreadyExists: true,
        correlationId: recentPending.order_id
      });
    }

    // Create store order with idempotency
    const storeOrder = await base44.asServiceRole.entities.StoreOrder.create({
      order_id: orderId,
      idempotency_key: idempotencyKey,
      buyer_user_id: user.id,
      item_type: 'PREMIUM',
      item_sku: plan_key,
      item_name: plan.name,
      quantity: 1,
      price_brl: plan.price_brl,
      payment_method: 'BRL',
      status: 'pending',
      metadata: { duration_days: plan.duration_days }
    });

    // Create payment transaction
    const transaction = await base44.asServiceRole.entities.PaymentTransaction.create({
      provider: 'TEST',
      status: 'PENDING',
      gross_amount_brl: plan.price_brl,
      net_amount_brl: plan.price_brl,
      fees_brl: 0,
      currency: 'BRL',
      raw_payload: JSON.stringify({
        type: 'VIP_PREMIUM',
        user_id: user.id,
        plan_key,
        plan_name: plan.name,
        duration_days: plan.duration_days,
        order_id: orderId
      })
    });

    // Track premium purchase in analytics (pending status)
    // Will be updated to fulfilled when payment confirms
    // For now we track the intention
    // Real tracking happens in payment webhook/confirmation

    return Response.json({
      success: true,
      transaction_id: transaction.id,
      order_id: orderId,
      payment_url: `/minha-conta/premium?payment_pending=${transaction.id}`,
      summary: `Você está comprando ${plan.name} por R$ ${plan.price_brl.toFixed(2)} (30 dias).`,
      correlationId: orderId
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});