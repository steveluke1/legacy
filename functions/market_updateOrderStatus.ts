import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { action, order_id, listing_id } = body;

    if (action === 'buyer_confirm_received') {
      // Buyer confirming they received the item/ALZ in-game
      if (!order_id) {
        return Response.json({ success: false, error: 'ID do pedido não fornecido' }, { status: 400 });
      }

      const orders = await base44.entities.MarketOrder.filter({ id: order_id });
      if (!orders || orders.length === 0) {
        return Response.json({ success: false, error: 'Pedido não encontrado' }, { status: 404 });
      }

      const order = orders[0];

      if (order.buyer_user_id !== user.id) {
        return Response.json({ success: false, error: 'Você não tem permissão para confirmar este pedido' }, { status: 403 });
      }

      if (order.status !== 'PAID') {
        return Response.json({ success: false, error: 'Pedido não está no status correto para confirmação' }, { status: 400 });
      }

      // Update order
      await base44.entities.MarketOrder.update(order.id, {
        status: 'COMPLETED',
        completed_at: new Date().toISOString()
      });

      // Update listing
      await base44.entities.MarketListing.update(order.listing_id, {
        status: 'SOLD'
      });

      // Log action
      await base44.entities.MarketAuditLog.create({
        action: 'ORDER_COMPLETED',
        user_id: user.id,
        username: user.username || user.full_name,
        listing_id: order.listing_id,
        order_id: order.id,
        metadata_json: JSON.stringify({ completed_at: new Date().toISOString() })
      });

      // Log commerce event for analytics
      const snapshot = order.listing_snapshot || {};
      await base44.asServiceRole.entities.CommerceEvent.create({
        eventType: 'ALZ_ORDER_COMPLETED',
        actorUserId: user.id,
        targetAccountId: snapshot.seller_user_id,
        listingId: order.listing_id,
        orderId: order.id,
        productCategory: 'ALZ',
        quantity: 1,
        currency: 'BRL',
        amount: order.total_price_brl,
        amountBrl: order.total_price_brl,
        amountAlz: snapshot.alz_amount,
        metadata: { listing_type: snapshot.type },
        correlationId: order.id
      });

      // Track ALZ trade in analytics (BUY)
      await base44.asServiceRole.entities.AnalyticsEvent.create({
        event_type: 'alz_trade',
        event_name: 'ALZ_BUY',
        path: '/mercado',
        role_context: 'user',
        user_id: user.id,
        session_id: `trade_${order.id}`,
        anon_id: `user_${user.id}`,
        day_key: new Date().toISOString().split('T')[0],
        dedupe_key: `alz_buy_${order.id}`,
        metadata: {
          order_id: order.id,
          trade_type: 'BUY',
          alz_amount: snapshot.alz_amount,
          amount_brl: order.total_price_brl
        }
      });

      return Response.json({ success: true });
    }

    if (action === 'cancel_listing') {
      // Seller cancelling their listing
      if (!listing_id) {
        return Response.json({ success: false, error: 'ID do anúncio não fornecido' }, { status: 400 });
      }

      const listings = await base44.entities.MarketListing.filter({ id: listing_id });
      if (!listings || listings.length === 0) {
        return Response.json({ success: false, error: 'Anúncio não encontrado' }, { status: 404 });
      }

      const listing = listings[0];

      if (listing.seller_user_id !== user.id) {
        return Response.json({ success: false, error: 'Você não tem permissão para cancelar este anúncio' }, { status: 403 });
      }

      if (listing.status !== 'ACTIVE') {
        return Response.json({ success: false, error: 'Anúncio não pode ser cancelado' }, { status: 400 });
      }

      // Update listing
      await base44.entities.MarketListing.update(listing.id, {
        status: 'CANCELLED'
      });

      // Log action
      await base44.entities.MarketAuditLog.create({
        action: 'LISTING_CANCELLED',
        user_id: user.id,
        username: user.username || user.full_name,
        listing_id: listing.id,
        metadata_json: JSON.stringify({ cancelled_at: new Date().toISOString() })
      });

      return Response.json({ success: true });
    }

    return Response.json({ success: false, error: 'Ação inválida' }, { status: 400 });
  } catch (error) {
    console.error('Error updating order status:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});