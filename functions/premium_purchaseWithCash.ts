import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const VIP_PLANS = {
  'VIP_SIMPLE': { name: 'VIP Cristal', price_cash: 3000, duration_days: 30 },
  'VIP_MEDIUM': { name: 'VIP Platina Ziron', price_cash: 6000, duration_days: 30 },
  'VIP_COMPLETE': { name: 'VIP Myth Ziron', price_cash: 8000, duration_days: 30 }
};

Deno.serve(async (req) => {
  try {
    const { plan_key, idempotency_key } = await req.json();
    
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    // IDEMPOTENCY: Check if already processed
    if (idempotency_key) {
      const existingOrders = await base44.asServiceRole.entities.StoreOrder.filter({
        idempotency_key
      });
      
      if (existingOrders.length > 0) {
        return Response.json({
          success: true,
          message: 'Pedido já processado (idempotente)',
          order_id: existingOrders[0].order_id,
          alreadyProcessed: true
        });
      }
    }
    const plan = VIP_PLANS[plan_key];

    if (!plan) {
      return Response.json({ 
        success: false,
        error: 'Plano inválido' 
      }, { status: 400 });
    }

    // Get game account
    const gameAccounts = await base44.asServiceRole.entities.GameAccount.filter({
      user_id: user.id
    });

    if (gameAccounts.length === 0) {
      return Response.json({ 
        success: false,
        error: 'Conta in-game não encontrada.' 
      }, { status: 404 });
    }

    const gameAccount = gameAccounts[0];
    const currentBalance = gameAccount.cash_balance || 0;

    if (currentBalance < plan.price_cash) {
      return Response.json({ 
        success: false,
        error: `Cash insuficiente. Você tem ${currentBalance} CASH, precisa de ${plan.price_cash} CASH.` 
      }, { status: 400 });
    }

    const newBalance = currentBalance - plan.price_cash;

    // Update balance
    await base44.asServiceRole.entities.GameAccount.update(gameAccount.id, {
      cash_balance: newBalance
    });

    // Create ledger entry
    await base44.asServiceRole.entities.CashLedger.create({
      account_id: gameAccount.id,
      operation: 'DEDUCT',
      amount: plan.price_cash,
      previous_balance: currentBalance,
      new_balance: newBalance,
      reason: `VIP Purchase: ${plan.name}`
    });

    // Check existing VIP
    const existingSubs = await base44.asServiceRole.entities.VipSubscription.filter({
      user_id: user.id,
      is_active: true
    });

    const now = new Date();
    let expiresAt;

    if (existingSubs.length > 0) {
      const currentExpires = new Date(existingSubs[0].expires_at);
      expiresAt = new Date(currentExpires.getTime() + (plan.duration_days * 24 * 60 * 60 * 1000));
      
      await base44.asServiceRole.entities.VipSubscription.update(existingSubs[0].id, {
        plan_key,
        plan_name: plan.name,
        expires_at: expiresAt.toISOString()
      });
    } else {
      expiresAt = new Date(now.getTime() + (plan.duration_days * 24 * 60 * 60 * 1000));
      
      await base44.asServiceRole.entities.VipSubscription.create({
        user_id: user.id,
        plan_key,
        plan_name: plan.name,
        started_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        is_active: true
      });
    }

    // Log audit
    await base44.asServiceRole.entities.MarketAuditLog.create({
      action: 'ORDER_PAID',
      user_id: user.id,
      username: user.full_name,
      metadata_json: JSON.stringify({
        type: 'VIP_PURCHASE_CASH',
        plan_key,
        plan_name: plan.name,
        cash_spent: plan.price_cash,
        new_balance: newBalance
      })
    });

    const orderId = crypto.randomUUID();

    // Create store order
    await base44.asServiceRole.entities.StoreOrder.create({
      order_id: orderId,
      idempotency_key: idempotency_key || orderId,
      buyer_user_id: user.id,
      item_type: 'PREMIUM',
      item_sku: plan_key,
      item_name: plan.name,
      quantity: 1,
      price_cash: plan.price_cash,
      payment_method: 'CASH',
      status: 'fulfilled',
      fulfilled_at: new Date().toISOString(),
      metadata: { duration_days: plan.duration_days }
    });

    // Log commerce event for analytics
    await base44.asServiceRole.entities.CommerceEvent.create({
      eventType: 'VIP_PURCHASE',
      actorUserId: user.id,
      actorAccountId: gameAccount.id,
      productKey: plan_key,
      productCategory: 'VIP',
      quantity: 1,
      currency: 'CASH',
      amount: plan.price_cash,
      amountCash: plan.price_cash,
      metadata: { plan_name: plan.name, duration_days: plan.duration_days, order_id: orderId },
      correlationId: orderId
    });

    // Track premium purchase in analytics
    await base44.asServiceRole.entities.AnalyticsEvent.create({
      event_type: 'premium_purchase',
      event_name: 'Premium/VIP',
      path: '/minha-conta/premium',
      role_context: 'user',
      user_id: user.id,
      session_id: `cash_${orderId}`,
      anon_id: `user_${user.id}`,
      day_key: new Date().toISOString().split('T')[0],
      dedupe_key: `premium_cash_${orderId}`,
      metadata: {
        order_id: orderId,
        plan_key,
        plan_name: plan.name,
        amount_cash: plan.price_cash,
        payment_method: 'CASH'
      }
    });

    return Response.json({
      success: true,
      message: `VIP ${plan.name} ativado com sucesso por 30 dias usando Cash.`,
      new_balance: newBalance,
      order_id: orderId,
      correlationId: orderId
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});