import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { writeLedgerEntry, writeAuditLog, generateCorrelationId } from './_shared/marketHelpers.js';

Deno.serve(async (req) => {
  const correlationId = generateCorrelationId();
  
  try {
    const base44 = createClientFromRequest(req);
    
    // Buscar listings expirados ainda ativos
    const now = new Date().toISOString();
    const allListings = await base44.asServiceRole.entities.AlzListing.filter({
      status: 'active'
    }, undefined, 500);
    
    const expiredListings = allListings.filter(l => l.expires_at && l.expires_at < now);
    
    const results = [];
    
    for (const listing of expiredListings) {
      try {
        // Buscar locks relacionados
        const locks = await base44.asServiceRole.entities.AlzLock.filter({
          listing_id: listing.listing_id,
          status: 'locked'
        });
        
        // Liberar locks
        for (const lock of locks) {
          await base44.asServiceRole.entities.AlzLock.update(lock.id, {
            status: 'released',
            release_reason: 'expired'
          });
          
          await writeLedgerEntry(base44, {
            entryType: 'alz_lock_released',
            listingId: listing.listing_id,
            lockId: lock.lock_id,
            actor: 'system',
            alzAmount: lock.alz_amount,
            metadata: { reason: 'expired' },
            correlationId
          });
        }
        
        // Atualizar listing
        await base44.asServiceRole.entities.AlzListing.update(listing.id, {
          status: 'expired'
        });
        
        await writeAuditLog(base44, {
          action: 'listing_expired',
          severity: 'info',
          message: `Anúncio expirado: ${listing.listing_id}`,
          data: { listingId: listing.listing_id, locksReleased: locks.length },
          correlationId
        });
        
        results.push({ listingId: listing.listing_id, locksReleased: locks.length });
        
      } catch (error) {
        results.push({ listingId: listing.listing_id, error: error.message });
      }
    }
    
    return Response.json({
      success: true,
      processed: results.length,
      results,
      correlationId
    }, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: 'Erro ao liberar locks expirados',
      correlationId
    }, {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});