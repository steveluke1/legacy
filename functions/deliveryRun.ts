import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import {
  getClientIp,
  hashIp,
  jsonResponse,
  errorResponse,
  requireMethods,
  requireHeaderSecret,
  readRawBodyWithLimit,
  safeParseJsonText,
  applyRateLimit,
  logSecurityEvent
} from './securityHelpers.js';

const BUILD_SIGNATURE = 'lon-deliveryRun-2025-12-23-v3';

async function writeLedgerEntry(base44, entryData) {
  try {
    await base44.asServiceRole.entities.MarketplaceLedger.create({
      entry_id: `ledger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entry_type: entryData.entryType,
      order_id: entryData.orderId || null,
      listing_id: entryData.listingId || null,
      lock_id: entryData.lockId || null,
      actor: entryData.actor || 'system',
      actor_user_id: entryData.actorUserId || null,
      amount_brl: entryData.amountBrl || null,
      alz_amount: entryData.alzAmount || null,
      metadata: entryData.metadata || {},
      correlation_id: entryData.correlationId
    });
  } catch (error) {
    console.error('[writeLedgerEntry] Error:', error.message);
  }
}

async function writeAuditLog(base44, logData) {
  try {
    await base44.asServiceRole.entities.MarketplaceAuditLog.create({
      log_id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action: logData.action,
      severity: logData.severity || 'info',
      message: logData.message,
      data: logData.data || {},
      correlation_id: logData.correlationId
    });
  } catch (error) {
    console.error('[writeAuditLog] Error:', error.message);
  }
}

Deno.serve(async (req) => {
  const correlationId = `corr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const base44 = createClientFromRequest(req);
    
    // Allow GET for health check (no auth/guards needed)
    if (req.method === 'GET') {
      return jsonResponse({
        ok: true,
        data: {
          message_ptbr: 'deliveryRun ativo.',
          build_signature: BUILD_SIGNATURE,
          correlation_id: correlationId
        }
      }, 200);
    }
    
    // 1. Method check (POST only for cron execution)
    const methodError = await requireMethods(req, ['POST'], base44.asServiceRole, 'deliveryRun');
    if (methodError) return methodError;
    
    // 2. Rate limiting (30 req/min per IP)
    const clientIp = getClientIp(req);
    const ipHash = await hashIp(clientIp);
    const bucketKey = `cron:${ipHash}`;
    
    const rateLimitResult = await applyRateLimit(
      base44.asServiceRole,
      bucketKey,
      30,
      60,
      'deliveryRun',
      req,
      { correlation_id: correlationId }
    );
    if (!rateLimitResult.ok) return rateLimitResult.response;
    
    // 3. Auth check (CRON_SECRET via x-cron-secret header)
    const authResult = await requireHeaderSecret(
      req,
      'x-cron-secret',
      'CRON_SECRET',
      'CRON_UNAUTHORIZED',
      base44.asServiceRole,
      'deliveryRun'
    );
    if (!authResult.ok) return authResult.response;
    
    console.log(`[deliveryRun:${correlationId}] Authorized`);
    
    // 4. Payload parsing (16KB limit)
    const bodyResult = await readRawBodyWithLimit(req, 16 * 1024);
    if (!bodyResult.ok) return bodyResult.response;
    
    const jsonResult = safeParseJsonText(bodyResult.rawText);
    if (!jsonResult.ok) return jsonResult.response;
    
    const payload = jsonResult.data;
    
    // 5. Business logic (unchanged)
    if (payload.mode === 'dryRun') {
      return jsonResponse({
        ok: true,
        data: {
          dryRun: true,
          build_signature: BUILD_SIGNATURE,
          correlation_id: correlationId
        }
      }, 200);
    }
    
    let ordersToProcess = [];
    
    if (payload.orderId) {
      const orders = await base44.asServiceRole.entities.AlzOrder.filter({ 
        order_id: payload.orderId 
      }, undefined, 1);
      if (orders.length > 0) {
        ordersToProcess = orders;
      }
    } else {
      ordersToProcess = await base44.asServiceRole.entities.AlzOrder.filter({ 
        status: 'paid' 
      }, undefined, 100);
    }
    
    const results = [];
    
    for (const order of ordersToProcess) {
      try {
        await base44.asServiceRole.entities.AlzOrder.update(order.id, {
          status: 'delivering'
        });
        
        await writeLedgerEntry(base44, {
          entryType: 'delivery_started',
          orderId: order.order_id,
          listingId: order.listing_id,
          actor: 'system',
          alzAmount: order.alz_amount,
          metadata: { characterName: order.buyer_character_name || order.character_nick },
          correlationId
        });
        
        const hasValidCharacter = order.buyer_character_snapshot && 
          order.buyer_character_snapshot.name === (order.buyer_character_name || order.character_nick);
        
        if (!hasValidCharacter) {
          await base44.asServiceRole.entities.AlzOrder.update(order.id, {
            status: 'in_review',
            notes: {
              ...order.notes,
              deliveryIssue: 'Personagem não validado, aguardando revisão manual'
            }
          });
          
          await writeAuditLog(base44, {
            action: 'delivery_review_required',
            severity: 'warn',
            message: `Ordem ${order.order_id} requer revisão manual`,
            data: { orderId: order.order_id, reason: 'invalid_character_snapshot' },
            correlationId
          });
          
          results.push({ orderId: order.order_id, status: 'in_review', reason: 'character_validation' });
          continue;
        }
        
        await base44.asServiceRole.entities.AlzOrder.update(order.id, {
          status: 'delivered',
          delivered_at: new Date().toISOString()
        });
        
        const locks = await base44.asServiceRole.entities.AlzLock.filter({
          listing_id: order.listing_id,
          status: 'locked'
        });
        
        for (const lock of locks) {
          await base44.asServiceRole.entities.AlzLock.update(lock.id, {
            status: 'consumed',
            consumed_order_id: order.order_id
          });
          
          await writeLedgerEntry(base44, {
            entryType: 'alz_lock_consumed',
            orderId: order.order_id,
            listingId: order.listing_id,
            lockId: lock.lock_id,
            actor: 'system',
            alzAmount: lock.alz_amount,
            metadata: { deliveryCompleted: true },
            correlationId
          });
        }
        
        const listings = await base44.asServiceRole.entities.AlzListing.filter({
          listing_id: order.listing_id
        }, undefined, 1);
        
        if (listings.length > 0) {
          await base44.asServiceRole.entities.AlzListing.update(listings[0].id, {
            status: 'sold'
          });
        }
        
        await writeLedgerEntry(base44, {
          entryType: 'delivery_completed',
          orderId: order.order_id,
          listingId: order.listing_id,
          actor: 'system',
          alzAmount: order.alz_amount,
          amountBrl: order.price_brl,
          metadata: { 
            characterName: order.buyer_character_name || order.character_nick,
            simulatedDelivery: true
          },
          correlationId
        });
        
        await writeAuditLog(base44, {
          action: 'delivery_completed',
          severity: 'info',
          message: `Entrega concluída: ${order.order_id}`,
          data: { orderId: order.order_id },
          correlationId
        });
        
        results.push({ orderId: order.order_id, status: 'delivered' });
        
      } catch (error) {
        results.push({ orderId: order.order_id, status: 'error', error: error.message });
        
        await writeAuditLog(base44, {
          action: 'delivery_failed',
          severity: 'error',
          message: `Falha na entrega: ${order.order_id}`,
          data: { orderId: order.order_id, error: error.message },
          correlationId
        });
      }
    }
    
    return jsonResponse({
      ok: true,
      data: {
        processed: results.length,
        results,
        build_signature: BUILD_SIGNATURE,
        correlation_id: correlationId
      }
    }, 200);
    
  } catch (error) {
    console.error(`[deliveryRun:${correlationId}] ERROR: ${error.message}`);
    return errorResponse('INTERNAL_ERROR', 'Erro ao processar entregas.', 500, {
      build_signature: BUILD_SIGNATURE,
      correlation_id: correlationId
    });
  }
});