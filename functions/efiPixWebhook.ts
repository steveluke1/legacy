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

const BUILD_SIGNATURE = 'lon-efiPixWebhook-2025-12-23-v3';
const MAX_BODY_SIZE = 256 * 1024;
const MAX_TIMESTAMP_SKEW = 300;

function getEfiConfig() {
  return {
    env: Deno.env.get('ENV') || 'development',
    webhookSharedSecret: Deno.env.get('EFI_WEBHOOK_SECRET'),
    webhookIpAllowlist: Deno.env.get('EFI_WEBHOOK_IP_ALLOWLIST')?.split(',') || []
  };
}

async function validateCharacterNick(nick) {
  return { exists: true };
}

async function deliverAlz(nick, amount) {
  return { success: true, receiptId: `receipt_${Date.now()}` };
}

Deno.serve(async (req) => {
  const correlationId = `wh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const base44 = createClientFromRequest(req);
    const config = getEfiConfig();
    
    // Allow GET for health check (no auth needed)
    if (req.method === 'GET') {
      return jsonResponse({
        ok: true,
        data: {
          message_ptbr: 'efiPixWebhook ativo.',
          build_signature: BUILD_SIGNATURE,
          correlation_id: correlationId
        }
      }, 200);
    }
    
    // 1. Method check (POST only for webhooks)
    const methodError = await requireMethods(req, ['POST'], base44.asServiceRole, 'efiPixWebhook');
    if (methodError) return methodError;
    
    // 2. Rate limiting (60 req/min per IP)
    const clientIp = getClientIp(req);
    const ipHash = await hashIp(clientIp);
    const bucketKey = `webhook:${ipHash}`;
    
    const rateLimitResult = await applyRateLimit(
      base44.asServiceRole,
      bucketKey,
      60,
      60,
      'efiPixWebhook',
      req,
      { correlation_id: correlationId }
    );
    if (!rateLimitResult.ok) return rateLimitResult.response;
    
    // 3. Auth check (EFI_WEBHOOK_SECRET via x-webhook-token header)
    const authResult = await requireHeaderSecret(
      req,
      'x-webhook-token',
      'EFI_WEBHOOK_SECRET',
      'WEBHOOK_UNAUTHORIZED',
      base44.asServiceRole,
      'efiPixWebhook'
    );
    if (!authResult.ok) return authResult.response;
    
    // 4. Payload parsing (256KB limit for webhooks)
    const bodyResult = await readRawBodyWithLimit(req, MAX_BODY_SIZE);
    if (!bodyResult.ok) return bodyResult.response;
    
    const jsonResult = safeParseJsonText(bodyResult.rawText);
    if (!jsonResult.ok) return jsonResult.response;
    
    const payload = jsonResult.data;

    // 5. Optional: IP allowlist check (if configured)
    if (config.webhookIpAllowlist && config.webhookIpAllowlist.length > 0) {
      if (clientIp && !config.webhookIpAllowlist.includes(clientIp)) {
        console.warn(`[efiPixWebhook:${correlationId}] REJECTED: IP_NOT_ALLOWED`);
        
        try {
          await logSecurityEvent({
            base44ServiceClient: base44.asServiceRole,
            event_type: 'IP_NOT_ALLOWED',
            severity: 'medium',
            actor_type: 'anon',
            ip: clientIp,
            user_agent: req.headers.get('user-agent') || 'unknown',
            route: 'efiPixWebhook',
            metadata: { correlation_id: correlationId }
          });
        } catch (logError) {
          console.error('[efiPixWebhook] Log error:', logError.message);
        }
        
        return errorResponse('IP_NOT_ALLOWED', 'IP não autorizado.', 403, {
          build_signature: BUILD_SIGNATURE,
          correlation_id: correlationId
        });
      }
    }
    
    // 6. Optional: Timestamp skew check (replay protection)
    const webhookTimestamp = req.headers.get('x-webhook-timestamp');
    if (webhookTimestamp) {
      try {
        const eventTime = parseInt(webhookTimestamp);
        const now = Math.floor(Date.now() / 1000);
        const skew = Math.abs(now - eventTime);
        
        if (skew > MAX_TIMESTAMP_SKEW) {
          console.warn(`[efiPixWebhook:${correlationId}] REJECTED: TIMESTAMP_SKEW skew=${skew}s`);
          return errorResponse('TIMESTAMP_SKEW', 'Evento expirado.', 400, {
            build_signature: BUILD_SIGNATURE,
            correlation_id: correlationId
          });
        }
      } catch (timestampError) {
        console.warn(`[efiPixWebhook:${correlationId}] WARN: INVALID_TIMESTAMP`);
      }
    }
    
    // 7. Business logic (unchanged)
    const pixArray = payload.pix || [];
    if (pixArray.length === 0) {
      console.log(`[efiPixWebhook:${correlationId}] EMPTY_PAYLOAD`);
      return jsonResponse({ 
        ok: true,
        data: {
          received: true,
          build_signature: BUILD_SIGNATURE,
          correlation_id: correlationId
        }
      }, 200);
    }

    const processedEvents = [];
    const ignoredEvents = [];

    for (const pixEvent of pixArray) {
      const txid = pixEvent.txid;
      const endToEndId = pixEvent.endToEndId;
      const providerEventId = pixEvent.e2eId || pixEvent.id || endToEndId;
      
      if (!txid) {
        console.warn(`[efiPixWebhook:${correlationId}] SKIP: NO_TXID`);
        continue;
      }

      const eventKey = providerEventId || txid;
      const existingEvents = await base44.asServiceRole.entities.PixWebhookEvent.filter({
        event_key: eventKey
      }, undefined, 1);
      
      if (existingEvents.length > 0) {
        const existingEvent = existingEvents[0];
        console.log(`[efiPixWebhook:${correlationId}] DUPLICATE event_key=${eventKey.substring(0, 8)}***`);
        
        ignoredEvents.push({
          txid: txid.substring(0, 8) + '***',
          status: 'already_processed',
          first_seen: existingEvent.first_seen_at
        });
        continue;
      }

      const charges = await base44.asServiceRole.entities.PixCharge.filter({ txid });
      if (charges.length === 0) {
        console.warn(`[efiPixWebhook:${correlationId}] NOT_FOUND txid=${txid.substring(0, 8)}***`);
        
        await base44.asServiceRole.entities.PixWebhookEvent.create({
          event_key: eventKey,
          txid,
          provider_event_id: providerEventId,
          end_to_end_id: endToEndId,
          status: 'ignored',
          first_seen_at: new Date().toISOString(),
          processed_at: new Date().toISOString(),
          correlation_id: correlationId,
          error_code: 'CHARGE_NOT_FOUND',
          raw_payload: { type: pixEvent.type || 'unknown' }
        });
        
        continue;
      }

      const charge = charges[0];

      const orders = await base44.asServiceRole.entities.AlzOrder.filter({ 
        order_id: charge.order_id 
      });
      
      if (orders.length === 0) {
        console.error(`[efiPixWebhook:${correlationId}] ERROR: ORDER_NOT_FOUND charge_order_id=${charge.order_id}`);
        
        await base44.asServiceRole.entities.PixWebhookEvent.create({
          event_key: eventKey,
          txid,
          provider_event_id: providerEventId,
          end_to_end_id: endToEndId,
          pix_charge_id: charge.pix_charge_id,
          status: 'failed',
          first_seen_at: new Date().toISOString(),
          correlation_id: correlationId,
          error_code: 'ORDER_NOT_FOUND',
          error_message: `Order ${charge.order_id} not found`,
          raw_payload: { order_id: charge.order_id }
        });
        
        continue;
      }

      const order = orders[0];

      if (order.status === 'paid' || order.status === 'delivering' || order.status === 'delivered') {
        console.log(`[efiPixWebhook:${correlationId}] ALREADY_PAID order=${order.order_id} status=${order.status}`);
        
        await base44.asServiceRole.entities.PixWebhookEvent.create({
          event_key: eventKey,
          txid,
          provider_event_id: providerEventId,
          end_to_end_id: endToEndId,
          order_id: order.order_id,
          pix_charge_id: charge.pix_charge_id,
          status: 'ignored',
          first_seen_at: new Date().toISOString(),
          processed_at: new Date().toISOString(),
          correlation_id: correlationId,
          raw_payload: { order_status: order.status, reason: 'already_processed' }
        });
        
        ignoredEvents.push({
          order_id: order.order_id,
          status: 'already_paid',
          order_status: order.status
        });
        continue;
      }

      const now = new Date().toISOString();
      await base44.asServiceRole.entities.PixWebhookEvent.create({
        event_key: eventKey,
        txid,
        provider_event_id: providerEventId,
        end_to_end_id: endToEndId,
        order_id: order.order_id,
        pix_charge_id: charge.pix_charge_id,
        status: 'received',
        first_seen_at: now,
        correlation_id: correlationId,
        raw_payload: { 
          type: pixEvent.type || 'payment',
          valor: pixEvent.valor
        }
      });

      try {
        await base44.asServiceRole.entities.PixCharge.update(charge.id, {
          status: 'paid',
          updated_at: now
        });

        await base44.asServiceRole.entities.AlzOrder.update(order.id, {
          status: 'paid',
          paid_at: now,
          updated_at: now
        });

        await base44.asServiceRole.entities.LedgerEntry.create({
          entry_id: `ledger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'PIX_CONFIRMED',
          ref_id: order.order_id,
          actor: 'system',
          amount_brl: order.price_brl,
          metadata: {
            txid: txid.substring(0, 8) + '***',
            endToEndId: endToEndId?.substring(0, 8) + '***',
            paid_at: now,
            correlation_id: correlationId
          },
          created_at: now
        });

        if (!order.split_applied) {
          const sellerNetBrl = order.seller_net_brl || (order.price_brl - (order.market_fee_brl || 0));
          
          const existingSplits = await base44.asServiceRole.entities.SplitPayout.filter({
            order_id: order.order_id
          }, undefined, 1);
          
          if (existingSplits.length === 0) {
            await base44.asServiceRole.entities.SplitPayout.create({
              payout_id: `payout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              order_id: order.order_id,
              seller_user_id: order.seller_user_id,
              gross_brl: order.price_brl,
              fee_brl: order.market_fee_brl || 0,
              net_brl: sellerNetBrl,
              status: config.env === 'production' ? 'scheduled' : 'pending',
              created_at: now,
              updated_at: now
            });

            await base44.asServiceRole.entities.AlzOrder.update(order.id, {
              split_applied: true,
              split_applied_at: now
            });

            await base44.asServiceRole.entities.LedgerEntry.create({
              entry_id: `ledger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              type: 'SPLIT_APPLIED',
              ref_id: order.order_id,
              actor: 'system',
              amount_brl: sellerNetBrl,
              metadata: {
                seller_user_id: order.seller_user_id,
                gross: order.price_brl,
                fee: order.market_fee_brl,
                net: sellerNetBrl,
                env: config.env,
                correlation_id: correlationId
              },
              created_at: now
            });

            console.log(`[efiPixWebhook:${correlationId}] SPLIT_CREATED order=${order.order_id}`);
          } else {
            console.warn(`[efiPixWebhook:${correlationId}] SPLIT_EXISTS order=${order.order_id}`);
          }
        } else {
          console.log(`[efiPixWebhook:${correlationId}] SPLIT_ALREADY_APPLIED order=${order.order_id}`);
        }

        await triggerDelivery(base44, order, correlationId, config);

        const events = await base44.asServiceRole.entities.PixWebhookEvent.filter({
          event_key: eventKey
        }, undefined, 1);
        
        if (events.length > 0) {
          await base44.asServiceRole.entities.PixWebhookEvent.update(events[0].id, {
            status: 'processed',
            processed_at: new Date().toISOString()
          });
        }

        processedEvents.push({
          order_id: order.order_id,
          txid: txid.substring(0, 8) + '***',
          status: 'processed'
        });

      } catch (processingError) {
        console.error(`[efiPixWebhook:${correlationId}] PROCESSING_ERROR order=${order.order_id} error=${processingError.message}`);
        
        const events = await base44.asServiceRole.entities.PixWebhookEvent.filter({
          event_key: eventKey
        }, undefined, 1);
        
        if (events.length > 0) {
          await base44.asServiceRole.entities.PixWebhookEvent.update(events[0].id, {
            status: 'failed',
            processed_at: new Date().toISOString(),
            error_code: 'PROCESSING_ERROR',
            error_message: processingError.message
          });
        }
      }
    }

    console.log(`[efiPixWebhook:${correlationId}] COMPLETE processed=${processedEvents.length} ignored=${ignoredEvents.length}`);

    return jsonResponse({ 
      ok: true,
      data: {
        received: true,
        processed: processedEvents.length,
        ignored: ignoredEvents.length,
        build_signature: BUILD_SIGNATURE,
        correlation_id: correlationId
      }
    }, 200);

  } catch (error) {
    console.error(`[efiPixWebhook:${correlationId}] CRITICAL_ERROR: ${error.message}`);
    // Return 200 for webhooks (best practice: don't retry on internal errors)
    return jsonResponse({ 
      ok: false, 
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro interno'
      },
      data: {
        build_signature: BUILD_SIGNATURE,
        correlation_id: correlationId
      }
    }, 200);
  }
});

async function triggerDelivery(base44, order, correlationId, config) {
  const now = new Date().toISOString();
  const characterNick = order.character_nick || order.buyer_character_name;

  try {
    await base44.asServiceRole.entities.AlzOrder.update(order.id, {
      status: 'delivering',
      updated_at: now
    });

    await base44.asServiceRole.entities.LedgerEntry.create({
      entry_id: `ledger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'DELIVERY_START',
      ref_id: order.order_id,
      actor: 'system',
      amount_alz: order.alz_amount,
      metadata: {
        character_nick: characterNick,
        attempt: (order.delivery_attempts || 0) + 1,
        correlation_id: correlationId
      },
      created_at: now
    });

    const validation = await validateCharacterNick(characterNick);
    
    if (!validation.exists) {
      throw new Error(`Personagem não encontrado: ${characterNick}`);
    }

    const delivery = await deliverAlz(characterNick, order.alz_amount);
    
    if (!delivery.success) {
      throw new Error(delivery.error || 'Falha na entrega');
    }

    await base44.asServiceRole.entities.AlzOrder.update(order.id, {
      status: 'delivered',
      delivered_at: now,
      delivery_attempts: (order.delivery_attempts || 0) + 1,
      updated_at: now
    });

    const locks = await base44.asServiceRole.entities.AlzLock.filter({ 
      listing_id: order.listing_id,
      status: 'locked'
    });
    
    if (locks.length > 0) {
      await base44.asServiceRole.entities.AlzLock.update(locks[0].id, {
        status: 'consumed',
        consumed_at: now,
        consumed_order_id: order.order_id
      });

      await base44.asServiceRole.entities.LedgerEntry.create({
        entry_id: `ledger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'ALZ_CONSUME',
        ref_id: order.order_id,
        actor: 'system',
        amount_alz: order.alz_amount,
        metadata: {
          lock_id: locks[0].lock_id,
          character_nick: characterNick,
          receipt_id: delivery.receiptId,
          correlation_id: correlationId
        },
        created_at: now
      });
    }

    await base44.asServiceRole.entities.LedgerEntry.create({
      entry_id: `ledger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'DELIVERY_SUCCESS',
      ref_id: order.order_id,
      actor: 'system',
      amount_alz: order.alz_amount,
      metadata: {
        character_nick: characterNick,
        receipt_id: delivery.receiptId,
        correlation_id: correlationId
      },
      created_at: now
    });

  } catch (deliveryError) {
    console.error(`[triggerDelivery:${correlationId}] order=${order.order_id} error=${deliveryError.message}`);
    
    const attempts = (order.delivery_attempts || 0) + 1;
    const newStatus = attempts >= 3 ? 'manual_review' : 'paid';

    await base44.asServiceRole.entities.AlzOrder.update(order.id, {
      status: newStatus,
      delivery_attempts: attempts,
      updated_at: now
    });

    await base44.asServiceRole.entities.LedgerEntry.create({
      entry_id: `ledger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'DELIVERY_FAIL',
      ref_id: order.order_id,
      actor: 'system',
      metadata: {
        error: deliveryError.message,
        attempt: attempts,
        character_nick: characterNick,
        manual_review: attempts >= 3,
        correlation_id: correlationId
      },
      created_at: now
    });
  }
}