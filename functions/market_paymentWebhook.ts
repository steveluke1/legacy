import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    // This endpoint receives callbacks from payment providers
    // For TEST mode, we'll simulate instant approval
    
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    
    const { provider_reference, status, provider } = body;

    if (!provider_reference) {
      return Response.json({ success: false, error: 'Referência do provedor não fornecida' }, { status: 400 });
    }

    // Find transaction
    const transactions = await base44.asServiceRole.entities.PaymentTransaction.filter({ 
      provider_reference 
    });

    if (!transactions || transactions.length === 0) {
      return Response.json({ success: false, error: 'Transação não encontrada' }, { status: 404 });
    }

    const transaction = transactions[0];

    // Payment succeeded
    if (status === 'approved' || status === 'paid') {
      // Update transaction
      await base44.asServiceRole.entities.PaymentTransaction.update(transaction.id, {
        status: 'PAID',
        raw_payload: JSON.stringify(body)
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
            amount: transaction.gross_amount_brl 
          })
        });
      }

      return Response.json({ success: true, message: 'Pagamento confirmado' });
    }

    // Payment failed
    if (status === 'failed' || status === 'cancelled' || status === 'expired') {
      await base44.asServiceRole.entities.PaymentTransaction.update(transaction.id, {
        status: 'FAILED',
        raw_payload: JSON.stringify(body)
      });

      // Find associated order and cancel it
      const orders = await base44.asServiceRole.entities.MarketOrder.filter({
        payment_transaction_id: transaction.id
      });

      if (orders && orders.length > 0) {
        const order = orders[0];

        await base44.asServiceRole.entities.MarketOrder.update(order.id, {
          status: 'CANCELLED'
        });

        // Restore listing to ACTIVE
        await base44.asServiceRole.entities.MarketListing.update(order.listing_id, {
          status: 'ACTIVE'
        });

        // Log action
        await base44.asServiceRole.entities.MarketAuditLog.create({
          action: 'ORDER_CANCELLED',
          order_id: order.id,
          listing_id: order.listing_id,
          metadata_json: JSON.stringify({ reason: 'payment_failed' })
        });
      }

      return Response.json({ success: true, message: 'Pagamento falhou, pedido cancelado' });
    }

    return Response.json({ success: true, message: 'Webhook recebido' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});