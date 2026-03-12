import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { order_id, payment_reference } = await req.json();

    if (!order_id) {
      return Response.json({
        success: false,
        error: 'order_id é obrigatório'
      }, { status: 400 });
    }

    // Find the store order
    const orders = await base44.asServiceRole.entities.StoreOrder.filter({
      order_id
    });

    if (orders.length === 0) {
      return Response.json({
        success: false,
        error: 'Pedido não encontrado'
      }, { status: 404 });
    }

    const order = orders[0];

    // IDEMPOTENCY: Check if already fulfilled
    if (order.status === 'fulfilled') {
      return Response.json({
        success: true,
        message: 'Pedido já foi processado anteriormente',
        order,
        alreadyProcessed: true,
        correlationId: order.order_id
      });
    }

    // IDEMPOTENCY: Check if already paid (prevent double processing)
    if (order.status === 'paid') {
      return Response.json({
        success: true,
        message: 'Pagamento já confirmado, processando...',
        order,
        alreadyProcessed: true,
        correlationId: order.order_id
      });
    }

    // Update order status
    await base44.asServiceRole.entities.StoreOrder.update(order.id, {
      status: 'paid',
      payment_transaction_id: payment_reference
    });

    // For Premium orders, activate the subscription
    if (order.item_type === 'PREMIUM') {
      const existingSubs = await base44.asServiceRole.entities.VipSubscription.filter({
        user_id: order.buyer_user_id,
        is_active: true
      });

      const now = new Date();
      const durationDays = order.metadata?.duration_days || 30;
      let expiresAt;

      if (existingSubs.length > 0) {
        const currentExpires = new Date(existingSubs[0].expires_at);
        expiresAt = new Date(currentExpires.getTime() + (durationDays * 24 * 60 * 60 * 1000));
        
        await base44.asServiceRole.entities.VipSubscription.update(existingSubs[0].id, {
          plan_key: order.item_sku,
          plan_name: order.item_name,
          expires_at: expiresAt.toISOString()
        });
      } else {
        expiresAt = new Date(now.getTime() + (durationDays * 24 * 60 * 60 * 1000));
        
        await base44.asServiceRole.entities.VipSubscription.create({
          user_id: order.buyer_user_id,
          plan_key: order.item_sku,
          plan_name: order.item_name,
          started_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          is_active: true
        });
      }

      // Update order to fulfilled
      await base44.asServiceRole.entities.StoreOrder.update(order.id, {
        status: 'fulfilled',
        fulfilled_at: new Date().toISOString()
      });

      // Track premium purchase in analytics (non-blocking)
      try {
        await base44.asServiceRole.entities.AnalyticsEvent.create({
          event_type: 'premium_purchase',
          event_name: 'Premium/VIP',
          path: '/minha-conta/premium',
          role_context: 'user',
          user_id: order.buyer_user_id,
          session_id: `payment_${order_id}`,
          anon_id: `user_${order.buyer_user_id}`,
          day_key: new Date().toISOString().split('T')[0],
          dedupe_key: `premium_${order_id}`,
          metadata: {
            order_id,
            plan_key: order.item_sku,
            plan_name: order.item_name,
            amount_brl: order.price_brl,
            payment_method: 'BRL'
          }
        });
      } catch (logError) {
        console.warn('Failed to log analytics event:', order_id, logError.message);
      }

      // Create notification for successful payment
      try {
        const { createNotification } = await import('./_shared/notificationHelper.js');
        await createNotification(base44.asServiceRole, {
          user_id: order.buyer_user_id,
          title: 'Pagamento confirmado',
          message: `Seu pagamento de R$ ${order.price_brl.toFixed(2)} foi confirmado e o plano ${order.item_name} foi ativado na sua conta.`,
          type: 'BRL_PURCHASE',
          action_url: '/MinhaContaPremium',
          dedupe_key: `BRL_PURCHASE:${order_id}`,
          metadata: { related_entity_id: order_id }
        });
      } catch (notifError) {
        console.warn('Failed to create notification:', order_id, notifError.message);
      }
    }

    return Response.json({
      success: true,
      message: 'Pagamento confirmado com sucesso',
      order_id,
      correlationId: order_id
    });

  } catch (error) {
    console.error('Confirm payment error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});