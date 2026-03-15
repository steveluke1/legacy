import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { writeLedgerEntry, writeAuditLog, generateCorrelationId, safeParseJson } from './_shared/marketHelpers.js';

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
    
    if (!data || !data.listing_id) {
      return Response.json({
        success: false,
        error: 'listing_id é obrigatório',
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
    
    // Verificar ownership ou admin
    const isAdmin = user.role === 'admin';
    if (listing.seller_user_id !== user.id && !isAdmin) {
      return Response.json({
        success: false,
        error: 'Você não tem permissão para cancelar este anúncio',
        correlationId
      }, {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Verificar se pode cancelar
    if (listing.status === 'sold' || listing.status === 'cancelled') {
      return Response.json({
        success: false,
        error: `Não é possível cancelar anúncio com status ${listing.status}`,
        correlationId
      }, {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (listing.status === 'reserved') {
      return Response.json({
        success: false,
        error: 'Não é possível cancelar anúncio reservado',
        correlationId
      }, {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Buscar e liberar lock
    const locks = await base44.asServiceRole.entities.AlzLock.filter({
      listing_id: data.listing_id,
      status: 'locked'
    });
    
    for (const lock of locks) {
      await base44.asServiceRole.entities.AlzLock.update(lock.id, {
        status: 'released',
        release_reason: isAdmin ? 'admin' : 'cancelled'
      });
      
      // Ledger entry
      await writeLedgerEntry(base44, {
        entryType: 'alz_lock_released',
        listingId: data.listing_id,
        lockId: lock.lock_id,
        actor: isAdmin ? 'admin' : 'seller',
        actorUserId: user.id,
        alzAmount: lock.alz_amount,
        metadata: { reason: isAdmin ? 'admin' : 'cancelled' },
        correlationId
      });
    }
    
    // Atualizar listing
    await base44.asServiceRole.entities.AlzListing.update(listing.id, {
      status: 'cancelled'
    });
    
    // Audit log
    await writeAuditLog(base44, {
      action: 'listing_cancelled',
      severity: 'info',
      message: `Anúncio cancelado: ${data.listing_id}`,
      data: { listingId: data.listing_id, userId: user.id, isAdmin },
      correlationId
    });
    
    return Response.json({
      success: true,
      listing: {
        listing_id: data.listing_id,
        status: 'cancelled'
      },
      locksReleased: locks.length,
      correlationId,
      notes: {
        cancelled: true
      }
    }, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: 'Erro ao cancelar anúncio',
      correlationId
    }, {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});