import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * DISABLED IN PRODUCTION - Simulation endpoints removed
 * Real payments must use webhook confirmation only (premium_confirmPayment)
 * This function is permanently disabled to prevent fake VIP activations
 */
Deno.serve(async (req) => {
  console.warn('[premium_simulatePayment] BLOCKED - Simulation disabled in production');
  
  return Response.json({
    success: false,
    error: {
      code: 'DISABLED',
      message: 'Recurso desativado em produção. Use apenas pagamentos reais confirmados via webhook.'
    }
  }, { status: 403 });
});

/* ORIGINAL CODE DISABLED - DO NOT REMOVE COMMENT BLOCK
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

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

    const { transaction_id } = await req.json();

    if (!transaction_id) {
      return Response.json({ 
        success: false,
        error: 'transaction_id é obrigatório' 
      }, { status: 400 });
    }

    // Get transaction
    const transactions = await base44.asServiceRole.entities.PaymentTransaction.filter({
      id: transaction_id
    });

    if (transactions.length === 0) {
      return Response.json({ 
        success: false,
        error: 'Transação não encontrada' 
      }, { status: 404 });
    }

    const transaction = transactions[0];
    const payload = JSON.parse(transaction.raw_payload || '{}');

    // Update transaction to paid
    await base44.asServiceRole.entities.PaymentTransaction.update(transaction.id, {
      status: 'PAID'
    });

    // Update store order if exists
    if (payload.order_id) {
      const orders = await base44.asServiceRole.entities.StoreOrder.filter({
        order_id: payload.order_id
      });

      if (orders.length > 0) {
        await base44.asServiceRole.entities.StoreOrder.update(orders[0].id, {
          status: 'paid'
        });
      }
    }

    // Create VIP subscription
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (payload.duration_days || 30));

    await base44.asServiceRole.entities.VipSubscription.create({
      user_id: user.id,
      plan_key: payload.plan_key,
      plan_name: payload.plan_name,
      started_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      is_active: true
    });

    // Track premium purchase event in analytics
    await base44.asServiceRole.entities.AnalyticsEvent.create({
      event_type: 'premium_purchase',
      event_name: 'Premium/VIP',
      path: '/minha-conta/premium',
      role_context: 'user',
      user_id: user.id,
      session_id: `sim_${Date.now()}`,
      anon_id: `sim_${user.id}`,
      day_key: new Date().toISOString().split('T')[0],
      dedupe_key: `premium_${payload.order_id || transaction_id}`,
      metadata: {
        order_id: payload.order_id,
        plan_key: payload.plan_key,
        plan_name: payload.plan_name,
        amount_brl: transaction.gross_amount_brl
      }
    });

    // Update store order to fulfilled
    if (payload.order_id) {
      const orders = await base44.asServiceRole.entities.StoreOrder.filter({
        order_id: payload.order_id
      });

      if (orders.length > 0) {
        await base44.asServiceRole.entities.StoreOrder.update(orders[0].id, {
          status: 'fulfilled',
          fulfilled_at: new Date().toISOString()
        });
      }
    }

    return Response.json({
      success: true,
      message: `${payload.plan_name} ativado com sucesso! Válido até ${expiresAt.toLocaleDateString('pt-BR')}`
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});
END DISABLED CODE */