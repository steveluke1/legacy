import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { generateId, generateCorrelationId } from './_shared/marketHelpers.js';

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
    
    const timestamp = Date.now();
    const results = {};
    
    // 1. Criar config global se não existir
    const configs = await base44.asServiceRole.entities.MarketConfig.filter({ slug: 'global' }, undefined, 1);
    if (configs.length === 0) {
      await base44.asServiceRole.entities.MarketConfig.create({
        slug: 'global',
        market_fee_percent: 1.5,
        pix_mode: 'mock',
        split_mode: 'mock',
        updated_by_admin_id: user.id,
        updated_at: new Date().toISOString(),
        notes: { demo: true }
      });
      results.config = 'created';
    } else {
      results.config = 'exists';
    }
    
    // 2. Criar SellerProfile
    const sellerId = `demo-seller-${timestamp}`;
    const sellerProfile = await base44.asServiceRole.entities.SellerProfile.create({
      user_id: sellerId,
      full_name: 'Vendedor Demo',
      cpf: '12345678901',
      efi_pix_key: 'vendedor@demo.com',
      is_kyc_verified: true,
      risk_tier: 'trusted'
    });
    results.sellerProfile = sellerProfile.id;
    
    // 3. Criar Listing 1 (Active com Lock)
    const listing1Id = generateId('listing');
    const listing1 = await base44.asServiceRole.entities.AlzListing.create({
      listing_id: listing1Id,
      seller_user_id: sellerId,
      seller_character_name: 'DemoChar1',
      alz_amount: 5000000000,
      price_brl: 150.00,
      status: 'active',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      notes: { demo: true }
    });
    
    const lock1 = await base44.asServiceRole.entities.AlzLock.create({
      lock_id: generateId('lock'),
      listing_id: listing1Id,
      seller_user_id: sellerId,
      seller_character_name: 'DemoChar1',
      alz_amount: 5000000000,
      status: 'locked',
      locked_at: new Date().toISOString(),
      idempotency_key: `demo-lock-1-${timestamp}`
    });
    results.listing1 = { listing: listing1.id, lock: lock1.id };
    
    // 4. Criar Listing 2 (Active com Lock)
    const listing2Id = generateId('listing');
    const listing2 = await base44.asServiceRole.entities.AlzListing.create({
      listing_id: listing2Id,
      seller_user_id: sellerId,
      seller_character_name: 'DemoChar2',
      alz_amount: 10000000000,
      price_brl: 280.00,
      status: 'active',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      notes: { demo: true }
    });
    
    const lock2 = await base44.asServiceRole.entities.AlzLock.create({
      lock_id: generateId('lock'),
      listing_id: listing2Id,
      seller_user_id: sellerId,
      seller_character_name: 'DemoChar2',
      alz_amount: 10000000000,
      status: 'locked',
      locked_at: new Date().toISOString(),
      idempotency_key: `demo-lock-2-${timestamp}`
    });
    results.listing2 = { listing: listing2.id, lock: lock2.id };
    
    // 5. Criar Order 1 (Delivered)
    const order1Id = generateId('order');
    const order1 = await base44.asServiceRole.entities.AlzOrder.create({
      order_id: order1Id,
      listing_id: `demo-listing-old-${timestamp}`,
      seller_user_id: sellerId,
      buyer_user_id: `demo-buyer-${timestamp}`,
      buyer_email: 'comprador@demo.com',
      buyer_character_name: 'BuyerChar1',
      buyer_character_snapshot: { name: 'BuyerChar1', class: 'WA', level: 150 },
      alz_amount: 3000000000,
      price_brl: 90.00,
      market_fee_percent: 1.5,
      market_fee_brl: 1.35,
      seller_net_brl: 88.65,
      status: 'delivered',
      pix_provider: 'EFI',
      pix_tx_id: `MOCK-PIX-${timestamp}-1`,
      paid_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      delivered_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      correlation_id: `corr-${timestamp}-1`,
      notes: { demo: true, delivered: true }
    });
    results.order1 = order1.id;
    
    // 6. Criar Order 2 (Awaiting PIX)
    const order2Id = generateId('order');
    const order2 = await base44.asServiceRole.entities.AlzOrder.create({
      order_id: order2Id,
      listing_id: listing1Id,
      seller_user_id: sellerId,
      buyer_user_id: `demo-buyer-2-${timestamp}`,
      buyer_email: 'comprador2@demo.com',
      buyer_character_name: 'BuyerChar2',
      buyer_character_snapshot: { name: 'BuyerChar2', class: 'BL', level: 160 },
      alz_amount: 5000000000,
      price_brl: 150.00,
      market_fee_percent: 1.5,
      market_fee_brl: 2.25,
      seller_net_brl: 147.75,
      status: 'awaiting_pix',
      pix_provider: 'EFI',
      pix_tx_id: `MOCK-PIX-${timestamp}-2`,
      pix_copy_paste: `00020126360014br.gov.bcb.pix0114MOCK${timestamp}52040000530398654150.005802BR5913CABAL ZIRON6009SAO PAULO62070503***6304MOCK`,
      correlation_id: `corr-${timestamp}-2`,
      notes: { demo: true, awaitingPayment: true }
    });
    results.order2 = order2.id;
    
    return Response.json({
      success: true,
      message: 'Dados demo criados com sucesso',
      results,
      correlationId,
      notes: {
        demo: true,
        timestamp
      }
    }, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: 'Erro ao criar dados demo',
      details: error.message,
      correlationId
    }, {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});