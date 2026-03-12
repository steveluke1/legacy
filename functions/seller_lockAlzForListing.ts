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
    
    if (!data || !data.listing_id || !data.idempotency_key) {
      return Response.json({
        success: false,
        error: 'listing_id e idempotency_key são obrigatórios',
        correlationId
      }, {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Verificar idempotência
    const existingLocks = await base44.asServiceRole.entities.AlzLock.filter({ idempotency_key: data.idempotency_key }, undefined, 1);
    if (existingLocks.length > 0) {
      return Response.json({
        success: true,
        lock: existingLocks[0],
        correlationId,
        notes: {
          alreadyProcessed: true
        }
      }, {
        status: 200,
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
    
    // Verificar ownership
    if (listing.seller_user_id !== user.id) {
      return Response.json({
        success: false,
        error: 'Você não é o dono deste anúncio',
        correlationId
      }, {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Verificar se listing está em draft
    if (listing.status !== 'draft') {
      return Response.json({
        success: false,
        error: `Anúncio não está em draft (status: ${listing.status})`,
        correlationId
      }, {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // TODO: Validar se vendedor está online e tem ALZ disponível no game
    // Por enquanto, stub aceita
    
    // Criar lock
    const lockId = generateId('lock');
    const lock = await base44.asServiceRole.entities.AlzLock.create({
      lock_id: lockId,
      listing_id: data.listing_id,
      seller_user_id: user.id,
      seller_character_name: listing.seller_character_name,
      alz_amount: listing.alz_amount,
      status: 'locked',
      locked_at: new Date().toISOString(),
      idempotency_key: data.idempotency_key
    });
    
    // Atualizar listing para active
    await base44.asServiceRole.entities.AlzListing.update(listing.id, {
      status: 'active'
    });
    
    // Ledger entry
    await writeLedgerEntry(base44, {
      entryType: 'alz_locked',
      listingId: data.listing_id,
      lockId: lockId,
      actor: 'seller',
      actorUserId: user.id,
      alzAmount: listing.alz_amount,
      metadata: { characterName: listing.seller_character_name },
      correlationId
    });
    
    // Audit log
    await writeAuditLog(base44, {
      action: 'alz_locked',
      severity: 'info',
      message: `ALZ bloqueado: ${listing.alz_amount} para anúncio ${data.listing_id}`,
      data: { lockId, listingId: data.listing_id, userId: user.id },
      correlationId
    });
    
    return Response.json({
      success: true,
      lock: {
        lock_id: lockId,
        status: 'locked',
        alz_amount: listing.alz_amount
      },
      listing: {
        listing_id: data.listing_id,
        status: 'active'
      },
      correlationId,
      notes: {
        lockCreated: true,
        listingActivated: true
      }
    }, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: 'Erro ao bloquear ALZ',
      correlationId
    }, {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});