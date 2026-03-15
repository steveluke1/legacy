import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { listing_id } = body;

    if (!listing_id) {
      return Response.json({ success: false, error: 'ID do anúncio não fornecido' }, { status: 400 });
    }

    // Get listing
    const listings = await base44.entities.MarketListing.filter({ id: listing_id });
    if (!listings || listings.length === 0) {
      return Response.json({ success: false, error: 'Anúncio não encontrado' }, { status: 404 });
    }

    const listing = listings[0];

    // Check RMT terms acceptance
    const termsAccepted = await base44.asServiceRole.entities.MarketTermsAccepted.filter({
      user_id: user.id
    });

    if (termsAccepted.length === 0) {
      return Response.json({ 
        success: false, 
        error: 'Você precisa aceitar os Termos do Mercado ZIRON antes de fazer compras.',
        redirect: '/mercado/termos'
      }, { status: 403 });
    }

    // Validations
    if (listing.status !== 'ACTIVE') {
      return Response.json({ success: false, error: 'Este anúncio não está mais disponível' }, { status: 400 });
    }

    if (listing.seller_user_id === user.id) {
      return Response.json({ success: false, error: 'Você não pode comprar seu próprio anúncio' }, { status: 400 });
    }

    // Create payment transaction (TEST mode for now)
    const transaction = await base44.entities.PaymentTransaction.create({
      provider: 'TEST',
      provider_reference: `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'PENDING',
      gross_amount_brl: listing.price_brl,
      net_amount_brl: listing.price_brl,
      fees_brl: 0,
      currency: 'BRL',
      payment_url: `https://payment-test.cabalziron.com/pay/${listing.id}`, // Simulated
      pix_code: `00020126580014BR.GOV.BCB.PIX0136${listing.id}${Date.now()}520400005303986540${listing.price_brl.toFixed(2)}5802BR5913CABAL ZIRON6009SAO PAULO62070503***6304ABCD` // Simulated PIX code
    });

    // Create order
    const order = await base44.entities.MarketOrder.create({
      listing_id: listing.id,
      buyer_user_id: user.id,
      buyer_username: user.username || user.full_name,
      total_price_brl: listing.price_brl,
      status: 'PENDING_PAYMENT',
      payment_transaction_id: transaction.id,
      listing_snapshot: {
        type: listing.type,
        alz_amount: listing.alz_amount,
        item_name: listing.item_name,
        item_description: listing.item_description,
        seller_username: listing.seller_username,
        price_brl: listing.price_brl
      }
    });

    // Mark listing as reserved (optional)
    await base44.entities.MarketListing.update(listing.id, { status: 'RESERVED' });

    // Log action
    await base44.entities.MarketAuditLog.create({
      action: 'ORDER_CREATED',
      user_id: user.id,
      username: user.username || user.full_name,
      listing_id: listing.id,
      order_id: order.id,
      metadata_json: JSON.stringify({ price_brl: listing.price_brl })
    });

    // Log commerce event for analytics
    await base44.asServiceRole.entities.CommerceEvent.create({
      eventType: 'ALZ_ORDER_CREATED',
      actorUserId: user.id,
      targetAccountId: listing.seller_user_id,
      listingId: listing.id,
      orderId: order.id,
      productCategory: 'ALZ',
      quantity: 1,
      currency: 'BRL',
      amount: listing.price_brl,
      amountBrl: listing.price_brl,
      amountAlz: listing.alz_amount,
      metadata: { listing_type: listing.type },
      correlationId: order.id
    });

    return Response.json({
      success: true,
      order,
      payment: {
        transaction_id: transaction.id,
        payment_url: transaction.payment_url,
        pix_code: transaction.pix_code,
        amount: transaction.gross_amount_brl
      }
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});