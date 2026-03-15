import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { generateId, writeLedgerEntry, writeAuditLog, generateCorrelationId, safeParseJson } from './_shared/marketHelpers.js';

Deno.serve(async (req) => {
  const correlationId = generateCorrelationId();
  
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({
        success: false,
        error: 'Não autorizado',
        correlationId
      }, {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = await req.text();
    const data = safeParseJson(body);
    
    if (!data || !data.seller_character_name || !data.alz_amount || !data.price_brl) {
      return Response.json({
        success: false,
        error: 'Dados inválidos: seller_character_name, alz_amount e price_brl são obrigatórios',
        correlationId
      }, {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Validações
    if (data.alz_amount <= 0) {
      return Response.json({
        success: false,
        error: 'Quantidade de ALZ deve ser maior que zero',
        correlationId
      }, {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (data.price_brl <= 0) {
      return Response.json({
        success: false,
        error: 'Preço deve ser maior que zero',
        correlationId
      }, {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Verificar perfil de vendedor
    const profiles = await base44.asServiceRole.entities.SellerProfile.filter({ user_id: user.id }, undefined, 1);
    if (profiles.length === 0) {
      return Response.json({
        success: false,
        error: 'Perfil de vendedor não encontrado. Complete seu cadastro primeiro.',
        correlationId
      }, {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Verificar limite de anúncios ativos
    const activeListings = await base44.asServiceRole.entities.AlzListing.filter({
      seller_user_id: user.id,
      status: 'active'
    });
    
    if (activeListings.length >= 10) {
      return Response.json({
        success: false,
        error: 'Você atingiu o limite de 10 anúncios ativos',
        correlationId
      }, {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // TODO: Validar se vendedor está online e tem ALZ disponível
    // Por enquanto, stub aceita qualquer valor
    
    const listingId = generateId('listing');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 dias
    
    const listing = await base44.asServiceRole.entities.AlzListing.create({
      listing_id: listingId,
      seller_user_id: user.id,
      seller_character_name: data.seller_character_name,
      alz_amount: data.alz_amount,
      price_brl: data.price_brl,
      status: 'draft',
      expires_at: expiresAt.toISOString(),
      notes: {
        createdBy: user.email,
        requiresLock: true
      }
    });
    
    // Ledger entry
    await writeLedgerEntry(base44, {
      entryType: 'listing_created',
      listingId: listingId,
      actor: 'seller',
      actorUserId: user.id,
      alzAmount: data.alz_amount,
      amountBrl: data.price_brl,
      metadata: { characterName: data.seller_character_name },
      correlationId
    });
    
    // Audit log
    await writeAuditLog(base44, {
      action: 'listing_created',
      severity: 'info',
      message: `Anúncio criado: ${data.alz_amount} ALZ por R$ ${data.price_brl}`,
      data: { listingId, userId: user.id },
      correlationId
    });
    
    return Response.json({
      success: true,
      listing: {
        listing_id: listingId,
        status: 'draft',
        alz_amount: data.alz_amount,
        price_brl: data.price_brl,
        expires_at: expiresAt.toISOString()
      },
      correlationId,
      notes: {
        nextStep: 'Call seller_lockAlzForListing to activate',
        requiresOnlineValidation: true
      }
    }, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: 'Erro ao criar anúncio',
      correlationId
    }, {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});