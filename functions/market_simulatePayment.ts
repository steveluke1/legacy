import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * DISABLED IN PRODUCTION - Simulation endpoints removed
 * Real payments must use webhook confirmation only
 * This function is permanently disabled to prevent fake market transactions
 */
Deno.serve(async (req) => {
  console.warn('[market_simulatePayment] BLOCKED - Simulation disabled in production');
  
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

// FUNCTION FOR TESTING ONLY - Simulates payment approval
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { provider_reference } = body;

    if (!provider_reference) {
      return Response.json({ success: false, error: 'Referência não fornecida' }, { status: 400 });
    }

    // Directly update transaction and order (simpler than calling webhook)
    const transactions = await base44.asServiceRole.entities.PaymentTransaction.filter({ 
      provider_reference 
    });

    if (!transactions || transactions.length === 0) {
      return Response.json({ success: false, error: 'Transação não encontrada' }, { status: 404 });
    }

    const transaction = transactions[0];

    // Update transaction
    await base44.asServiceRole.entities.PaymentTransaction.update(transaction.id, {
      status: 'PAID'
    });

    // Find associated order
    const orders = await base44.asServiceRole.entities.MarketOrder.filter({
      payment_transaction_id: transaction.id
    });

    if (orders && orders.length > 0) {
      const order = orders[0];

      // Update order
      await base44.asServiceRole.entities.MarketOrder.update(order.id, {
        status: 'PAID'
      });

      // Log action
      await base44.asServiceRole.entities.MarketAuditLog.create({
        action: 'ORDER_PAID',
        order_id: order.id,
        listing_id: order.listing_id,
        metadata_json: JSON.stringify({ 
          transaction_id: transaction.id,
          amount: transaction.gross_amount_brl,
          simulated: true
        })
      });

      return Response.json({ 
        success: true, 
        message: 'Pagamento simulado com sucesso',
        order_id: order.id,
        new_status: 'PAID'
      });
    }

    return Response.json({ success: false, error: 'Pedido associado não encontrado' }, { status: 404 });
  } catch (error) {
    console.error('Error simulating payment:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});
END DISABLED CODE */