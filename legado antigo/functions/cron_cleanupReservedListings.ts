import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { writeAuditLog, generateCorrelationId } from './_shared/marketHelpers.js';

Deno.serve(async (req) => {
  const correlationId = generateCorrelationId();
  
  try {
    const base44 = createClientFromRequest(req);
    
    // Buscar listings reservados
    const reservedListings = await base44.asServiceRole.entities.AlzListing.filter({
      status: 'reserved'
    }, undefined, 500);
    
    const results = [];
    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);
    
    for (const listing of reservedListings) {
      try {
        // Buscar ordem relacionada
        const orders = await base44.asServiceRole.entities.AlzOrder.filter({
          listing_id: listing.listing_id,
          status: 'awaiting_pix'
        }, '-created_date', 1);
        
        if (orders.length === 0) continue;
        
        const order = orders[0];
        const orderDate = new Date(order.created_date);
        
        // Verificar se passou do TTL (20 minutos)
        if (orderDate > twentyMinutesAgo) continue;
        
        // Cancelar ordem
        await base44.asServiceRole.entities.AlzOrder.update(order.id, {
          status: 'cancelled',
          notes: {
            ...order.notes,
            cancellationReason: 'Payment timeout (20 minutes)'
          }
        });
        
        // Reverter listing para active
        await base44.asServiceRole.entities.AlzListing.update(listing.id, {
          status: 'active'
        });
        
        await writeAuditLog(base44, {
          action: 'order_timeout_cancelled',
          severity: 'info',
          message: `Ordem cancelada por timeout: ${order.order_id}`,
          data: { orderId: order.order_id, listingId: listing.listing_id },
          correlationId
        });
        
        results.push({ orderId: order.order_id, listingId: listing.listing_id, action: 'cancelled' });
        
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
      error: 'Erro ao limpar listings reservados',
      correlationId
    }, {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});