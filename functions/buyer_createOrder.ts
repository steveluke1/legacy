import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { verifyUserToken } from './_shared/authHelpers.js';
import { generateId, getMarketConfig, writeLedgerEntry, writeAuditLog, generateCorrelationId, safeParseJson } from './_shared/marketHelpers.js';
import { createPixCharge } from './_shared/pixProviderAdapter.js';
import { planSplit } from './_shared/splitAdapter.js';

Deno.serve(async (req) => {
  const correlationId = generateCorrelationId();
  
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user token
    let user;
    try {
      user = await verifyUserToken(req, base44);
    } catch (authError) {
      return Response.json({
        success: false,
        error: authError.message,
        correlationId
      }, {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await req.text();
    const data = safeParseJson(body);
    
    if (!data || !data.listing_id || !data.buyer_character_name) {
      return Response.json({
        success: false,
        error: 'listing_id e buyer_character_name são obrigatórios',
        correlationId
      }, {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Buscar listing
    const listings = await base44.asServiceRole.entities.AlzListing.filter({ listing_id: data.listing_id }, undefined, 1);
    if (listings.length === 0) {
      return Response.json({
        success: false,
        error: 'Anúncio não encontrado',
        correlationId
      }, {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const listing = listings[0];
    
    // Verificar se está ativo
    if (listing.status !== 'active') {
      return Response.json({
        success: false,
        error: `Anúncio não disponível (status: ${listing.status})`,
        correlationId
      }, {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Buscar config de mercado
    const config = await getMarketConfig(base44);
    
    // Calcular taxas
    const marketFeeBrl = (listing.price_brl * config.market_fee_percent) / 100;
    const sellerNetBrl = listing.price_brl - marketFeeBrl;
    
    // Anti-abuse: cooldown para compras grandes
    const warnings = [];
    if (listing.price_brl > 500) {
      const recentOrders = await base44.asServiceRole.entities.AlzOrder.filter({
        buyer_user_id: user.userId
      }, '-created_date', 5);
      
      const oneMinuteAgo = new Date(Date.now() - 60000);
      const recentLargeOrders = recentOrders.filter(o => 
        o.price_brl > 500 && new Date(o.created_date) > oneMinuteAgo
      );
      
      if (recentLargeOrders.length > 0) {
        warnings.push('Cooldown: aguarde 60s entre compras grandes');
      }
    }
    
    // Buscar perfil do vendedor para split
    const sellerProfiles = await base44.asServiceRole.entities.SellerProfile.filter({
      user_id: listing.seller_user_id
    }, undefined, 1);
    
    const sellerProfile = sellerProfiles[0];
    
    // Planejar split
    const splitPlan = planSplit({
      amountBRL: listing.price_brl,
      feePercent: config.market_fee_percent,
      sellerPixKey: sellerProfile?.efi_pix_key || 'N/A',
      sellerName: sellerProfile?.full_name || 'Vendedor',
      correlationId,
      mode: config.split_mode
    });
    
    // Criar ordem
    const orderId = generateId('order');
    
    const order = await base44.asServiceRole.entities.AlzOrder.create({
      order_id: orderId,
      listing_id: data.listing_id,
      seller_user_id: listing.seller_user_id,
      buyer_user_id: user.userId,
      buyer_email: user.email,
      buyer_character_name: data.buyer_character_name,
      buyer_character_snapshot: data.character_snapshot || null,
      alz_amount: listing.alz_amount,
      price_brl: listing.price_brl,
      market_fee_percent: config.market_fee_percent,
      market_fee_brl: marketFeeBrl,
      seller_net_brl: sellerNetBrl,
      status: 'created',
      pix_provider: 'EFI',
      correlation_id: correlationId,
      notes: {
        warnings,
        splitPlan,
        antifraudChecks: {
          largePurchase: listing.price_brl > 500,
          cooldownApplied: warnings.length > 0
        }
      }
    });
    
    // Criar PIX charge
    const pixCharge = createPixCharge({
      order,
      amountBRL: listing.price_brl,
      buyerEmail: user.email,
      correlationId,
      mode: config.pix_mode
    });
    
    // Atualizar ordem com dados PIX
    await base44.asServiceRole.entities.AlzOrder.update(order.id, {
      status: 'awaiting_pix',
      pix_tx_id: pixCharge.txId,
      pix_qr_code: pixCharge.qrCode,
      pix_copy_paste: pixCharge.copyPaste
    });
    
    // Reservar listing
    await base44.asServiceRole.entities.AlzListing.update(listing.id, {
      status: 'reserved'
    });
    
    // Ledger entries
    await writeLedgerEntry(base44, {
      entryType: 'order_created',
      orderId,
      listingId: data.listing_id,
      actor: 'buyer',
      actorUserId: user.userId,
      amountBrl: listing.price_brl,
      alzAmount: listing.alz_amount,
      metadata: { characterName: data.buyer_character_name },
      correlationId
    });
    
    await writeLedgerEntry(base44, {
      entryType: 'split_planned',
      orderId,
      actor: 'system',
      amountBrl: listing.price_brl,
      metadata: splitPlan,
      correlationId
    });
    
    // Audit log
    await writeAuditLog(base44, {
      action: 'order_created',
      severity: 'info',
      message: `Ordem criada: ${orderId} - ${listing.alz_amount} ALZ por R$ ${listing.price_brl}`,
      data: { orderId, listingId: data.listing_id, userId: user.userId },
      correlationId
    });
    
    return Response.json({
      success: true,
      order: {
        order_id: orderId,
        status: 'awaiting_pix',
        alz_amount: listing.alz_amount,
        price_brl: listing.price_brl,
        market_fee_brl: marketFeeBrl,
        pix_copy_paste: pixCharge.copyPaste,
        pix_qr_code: pixCharge.qrCode
      },
      correlationId,
      notes: {
        warnings,
        nextStep: 'Realize o pagamento PIX',
        expiresIn: '20 minutos'
      }
    }, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: 'Erro ao criar ordem',
      details: error.message,
      correlationId
    }, {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});