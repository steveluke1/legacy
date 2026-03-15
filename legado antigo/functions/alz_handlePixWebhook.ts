import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import {
  requireMethods,
  readRawBodyWithLimit,
  safeParseJsonText,
  applyRateLimit,
  constantTimeEquals,
  logSecurityEvent,
  getClientIp,
  hashIp,
  jsonResponse,
  errorResponse
} from './securityHelpers.js';

const BUILD_SIGNATURE = 'P1-HARDENED-20251224-1600';

Deno.serve(async (req) => {
  const correlationId = `pix-legacy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const base44 = createClientFromRequest(req);
    
    // 1. Method check (POST only)
    const methodError = await requireMethods(req, ['POST'], base44.asServiceRole, 'alz_handlePixWebhook');
    if (methodError) return methodError;
    
    // 2. Rate limiting (60 req/min per IP, block 5 min)
    const clientIp = getClientIp(req);
    const ipHash = await hashIp(clientIp);
    const bucketKey = `pix-webhook-legacy:${ipHash}`;
    
    const rateLimitResult = await applyRateLimit(
      base44.asServiceRole,
      bucketKey,
      60,
      60,
      'alz_handlePixWebhook',
      req,
      { correlation_id: correlationId }
    );
    if (!rateLimitResult.ok) return rateLimitResult.response;
    
    // 3. Read and parse body (256KB limit)
    const bodyResult = await readRawBodyWithLimit(req, 256 * 1024);
    if (!bodyResult.ok) return bodyResult.response;
    
    const parseResult = safeParseJsonText(bodyResult.rawText);
    if (!parseResult.ok) return parseResult.response;
    
    const body = parseResult.data;
    const { providerReferenceId, status, webhookSignature } = body;

    if (!providerReferenceId || !status) {
      return errorResponse('MISSING_FIELDS', 'Dados do webhook inválidos. providerReferenceId e status são obrigatórios.', 400, {
        build_signature: BUILD_SIGNATURE,
        correlation_id: correlationId
      });
    }
    
    // 4. Validate PIX webhook signature (HMAC-SHA256, constant-time)
    const webhookSecret = Deno.env.get('PIX_WEBHOOK_SECRET');
    
    if (!webhookSecret || webhookSecret.trim() === '') {
      console.warn(`[alz_handlePixWebhook:${correlationId}] PIX_WEBHOOK_SECRET not configured - skipping signature validation`);
      
      await logSecurityEvent({
        base44ServiceClient: base44.asServiceRole,
        event_type: 'PIX_WEBHOOK_NO_SECRET',
        severity: 'high',
        actor_type: 'anon',
        ip: clientIp,
        user_agent: req.headers.get('user-agent') || 'unknown',
        route: 'alz_handlePixWebhook',
        metadata: {
          correlation_id: correlationId,
          note: 'Processing without signature validation'
        }
      });
    } else if (webhookSignature) {
      // Compute HMAC-SHA256
      const encoder = new TextEncoder();
      const keyData = encoder.encode(webhookSecret);
      const messageData = encoder.encode(`${providerReferenceId}:${status}`);
      
      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      
      const signature = await crypto.subtle.sign('HMAC', key, messageData);
      const expectedSignature = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      // CONSTANT-TIME comparison
      if (!constantTimeEquals(webhookSignature, expectedSignature)) {
        console.error(`[alz_handlePixWebhook:${correlationId}] Invalid signature`);
        
        await logSecurityEvent({
          base44ServiceClient: base44.asServiceRole,
          event_type: 'PIX_WEBHOOK_INVALID_SIGNATURE',
          severity: 'high',
          actor_type: 'anon',
          ip: clientIp,
          user_agent: req.headers.get('user-agent') || 'unknown',
          route: 'alz_handlePixWebhook',
          metadata: {
            correlation_id: correlationId
          }
        });
        
        return errorResponse('INVALID_SIGNATURE', 'Assinatura inválida.', 403, {
          build_signature: BUILD_SIGNATURE,
          correlation_id: correlationId
        });
      }

      console.log(`[alz_handlePixWebhook:${correlationId}] Signature valid`);
    } else if (webhookSecret && !webhookSignature) {
      // Secret configured but no signature provided - REJECT
      console.error(`[alz_handlePixWebhook:${correlationId}] Missing signature`);
      
      await logSecurityEvent({
        base44ServiceClient: base44.asServiceRole,
        event_type: 'PIX_WEBHOOK_MISSING_SIGNATURE',
        severity: 'medium',
        actor_type: 'anon',
        ip: clientIp,
        user_agent: req.headers.get('user-agent') || 'unknown',
        route: 'alz_handlePixWebhook',
        metadata: {
          correlation_id: correlationId
        }
      });
      
      return errorResponse('MISSING_SIGNATURE', 'Assinatura do webhook ausente.', 401, {
        build_signature: BUILD_SIGNATURE,
        correlation_id: correlationId
      });
    }

    // 5. Fetch payment
    const payments = await base44.asServiceRole.entities.AlzPixPayment.filter({
      provider_reference_id: providerReferenceId
    });

    if (payments.length === 0) {
      return errorResponse('PAYMENT_NOT_FOUND', 'Pagamento não encontrado.', 404, {
        build_signature: BUILD_SIGNATURE,
        correlation_id: correlationId
      });
    }

    const payment = payments[0];

    // 6. IDEMPOTENCY: Check if already processed
    if (payment.status !== 'pending') {
      return jsonResponse({
        ok: true,
        data: {
          received: true,
          already_processed: true,
          message: 'Pagamento já processado anteriormente (idempotente)',
          build_signature: BUILD_SIGNATURE,
          correlation_id: correlationId
        }
      }, 200);
    }

    // 7. Process payment by status
    if (status === 'paid') {
      // Mark payment as paid
      await base44.asServiceRole.entities.AlzPixPayment.update(payment.id, {
        status: 'paid'
      });

      // Fetch all splits for this payment
      const splits = await base44.asServiceRole.entities.AlzPaymentSplit.filter({
        pix_payment_id: payment.id
      });

      // Process each split
      const splitProcessingPromises = splits.map(async (split) => {
        // Mark split as paid
        await base44.asServiceRole.entities.AlzPaymentSplit.update(split.id, {
          status: 'paid'
        });

        // Fetch seller's orders (cheapest first)
        const orders = await base44.asServiceRole.entities.AlzSellOrder.filter({
          seller_user_id: split.seller_user_id
        });

        const activeOrders = orders
          .filter(o => o.remaining_alz > 0 && (o.status === 'active' || o.status === 'partial'))
          .sort((a, b) => a.price_per_billion_brl - b.price_per_billion_brl);

        // Decrement order
        for (const order of activeOrders) {
          if (order.remaining_alz >= split.alz_amount) {
            const newRemaining = order.remaining_alz - split.alz_amount;
            
            await base44.asServiceRole.entities.AlzSellOrder.update(order.id, {
              remaining_alz: newRemaining,
              status: newRemaining <= 0 ? 'filled' : 'partial'
            });

            // Unlock ALZ from seller's account
            const sellerAccounts = await base44.asServiceRole.entities.GameAccount.filter({
              id: order.seller_account_id
            });

            if (sellerAccounts.length > 0) {
              const sellerAccount = sellerAccounts[0];
              await base44.asServiceRole.entities.GameAccount.update(sellerAccount.id, {
                alz_locked: Math.max(0, (sellerAccount.alz_locked || 0) - split.alz_amount),
                alz_balance: Math.max(0, (sellerAccount.alz_balance || 0) - split.alz_amount)
              });
            }

            // Create trade record
            await base44.asServiceRole.entities.AlzTrade.create({
              buyer_user_id: payment.buyer_user_id,
              seller_user_id: split.seller_user_id,
              alz_amount: split.alz_amount,
              unit_price_per_billion_brl: order.price_per_billion_brl,
              total_price_brl: split.seller_price_brl,
              pix_payment_id: payment.id
            });

            break; // Process only first available order
          }
        }

        // Notify seller with modern notification helper
        try {
          const { createNotification } = await import('./_shared/notificationHelper.js');
          const alzB = (split.alz_amount / 1_000_000_000).toFixed(2);
          const brlAmount = split.seller_price_brl.toFixed(2);
          
          await createNotification(base44.asServiceRole, {
            user_id: split.seller_user_id,
            title: 'Venda de ALZ realizada',
            message: `Você vendeu ${alzB}B ALZ e recebeu R$ ${brlAmount}.`,
            type: 'ALZ_SELL',
            action_url: '/MercadoAlzVender',
            dedupe_key: `ALZ_SELL:${payment.id}:${split.seller_user_id}`,
            metadata: { related_entity_id: payment.id }
          });
        } catch (notifError) {
          console.warn('[alz_handlePixWebhook] Failed to create seller notification:', notifError.message);
          
          // Fallback to old direct entity creation
          await base44.asServiceRole.entities.Notification.create({
            user_id: split.seller_user_id,
            message: `Seus ${(split.alz_amount / 1_000_000_000).toFixed(2)}B ALZ foram vendidos por R$ ${split.seller_price_brl.toFixed(2)}`,
            type: 'system',
            related_entity_id: payment.id
          });
        }
      });

      await Promise.all(splitProcessingPromises);

      // CRITICAL: Credit ALZ to buyer's GameAccount
      const buyerAccounts = await base44.asServiceRole.entities.GameAccount.filter({
        user_id: payment.buyer_user_id
      }, undefined, 1);

      if (buyerAccounts.length > 0) {
        const buyerAccount = buyerAccounts[0];
        const newBalance = (buyerAccount.alz_balance || 0) + payment.requested_alz_amount;
        
        await base44.asServiceRole.entities.GameAccount.update(buyerAccount.id, {
          alz_balance: newBalance
        });

        console.log(`[alz_handlePixWebhook:${correlationId}] Buyer credited: ${payment.requested_alz_amount} ALZ (new balance: ${newBalance})`);
      } else {
        console.warn(`[alz_handlePixWebhook:${correlationId}] Buyer GameAccount not found for user ${payment.buyer_user_id}`);
      }

      // Update daily aggregate for all trades created
      const todayKey = new Date().toISOString().split('T')[0];
      const existingAgg = await base44.asServiceRole.entities.AlzTradeDailyAgg.filter({
        day_key: todayKey
      }, undefined, 1);

      const totalAlzTraded = splits.reduce((sum, split) => sum + split.alz_amount, 0);
      const totalBrlTraded = splits.reduce((sum, split) => sum + split.seller_price_brl, 0);
      const totalWeightedPrice = splits.reduce((sum, split) => {
        const pricePerBillion = (split.seller_price_brl / (split.alz_amount / 1_000_000_000));
        return sum + (split.alz_amount * pricePerBillion);
      }, 0);

      if (existingAgg.length > 0) {
        const agg = existingAgg[0];
        const newVolumeAlz = agg.volume_alz + totalAlzTraded;
        const newTotalWeightedPrice = agg.total_weighted_price + totalWeightedPrice;
        const newVwap = newTotalWeightedPrice / newVolumeAlz;

        await base44.asServiceRole.entities.AlzTradeDailyAgg.update(agg.id, {
          trades_count: agg.trades_count + splits.length,
          volume_alz: newVolumeAlz,
          total_weighted_price: newTotalWeightedPrice,
          vwap_price_per_billion_brl: newVwap,
          total_brl: agg.total_brl + totalBrlTraded
        });
      } else {
        const vwap = totalWeightedPrice / totalAlzTraded;
        
        await base44.asServiceRole.entities.AlzTradeDailyAgg.create({
          day_key: todayKey,
          trades_count: splits.length,
          volume_alz: totalAlzTraded,
          total_weighted_price: totalWeightedPrice,
          vwap_price_per_billion_brl: vwap,
          total_brl: totalBrlTraded
        });
      }

      // Notify buyer with modern notification helper
      try {
        const { createNotification } = await import('./_shared/notificationHelper.js');
        const alzB = (payment.requested_alz_amount / 1_000_000_000).toFixed(2);
        const brlTotal = payment.total_price_brl.toFixed(2);
        
        await createNotification(base44.asServiceRole, {
          user_id: payment.buyer_user_id,
          title: 'Compra de ALZ confirmada',
          message: `Você recebeu ${alzB}B ALZ. Total pago: R$ ${brlTotal}.`,
          type: 'ALZ_BUY',
          action_url: '/Mercado',
          dedupe_key: `ALZ_BUY:${payment.id}`,
          metadata: { related_entity_id: payment.id }
        });
      } catch (notifError) {
        console.warn('[alz_handlePixWebhook] Failed to create buyer notification:', notifError.message);
        
        // Fallback to old direct entity creation
        await base44.asServiceRole.entities.Notification.create({
          user_id: payment.buyer_user_id,
          message: `Compra de ${(payment.requested_alz_amount / 1_000_000_000).toFixed(2)}B ALZ confirmada! Os ALZ foram creditados na sua conta.`,
          type: 'system',
          related_entity_id: payment.id
        });
      }

      console.log(`[alz_handlePixWebhook:${correlationId}] Payment processed successfully (${splits.length} splits)`);
      
      await logSecurityEvent({
        base44ServiceClient: base44.asServiceRole,
        event_type: 'PIX_WEBHOOK_PROCESSED',
        severity: 'low',
        actor_type: 'system',
        ip: clientIp,
        user_agent: req.headers.get('user-agent') || 'unknown',
        route: 'alz_handlePixWebhook',
        metadata: {
          status: 'paid',
          splits_processed: splits.length,
          correlation_id: correlationId
        }
      });

      return jsonResponse({
        ok: true,
        data: {
          received: true,
          processed: true,
          splits_processed: splits.length,
          build_signature: BUILD_SIGNATURE,
          correlation_id: correlationId
        }
      }, 200);

    } else if (status === 'cancelled' || status === 'expired') {
      await base44.asServiceRole.entities.AlzPixPayment.update(payment.id, {
        status
      });

      await logSecurityEvent({
        base44ServiceClient: base44.asServiceRole,
        event_type: 'PIX_WEBHOOK_PROCESSED',
        severity: 'low',
        actor_type: 'system',
        ip: clientIp,
        user_agent: req.headers.get('user-agent') || 'unknown',
        route: 'alz_handlePixWebhook',
        metadata: {
          status,
          correlation_id: correlationId
        }
      });

      return jsonResponse({
        ok: true,
        data: {
          received: true,
          processed: true,
          message: `Pagamento ${status}`,
          build_signature: BUILD_SIGNATURE,
          correlation_id: correlationId
        }
      }, 200);
    }

    return errorResponse('UNKNOWN_STATUS', 'Status não processado.', 400, {
      build_signature: BUILD_SIGNATURE,
      correlation_id: correlationId
    });

  } catch (error) {
    console.error(`[alz_handlePixWebhook:${correlationId}] CRITICAL ERROR: ${error.message}`);
    
    await logSecurityEvent({
      base44ServiceClient: base44.asServiceRole,
      event_type: 'PIX_WEBHOOK_ERROR',
      severity: 'medium',
      actor_type: 'system',
      route: 'alz_handlePixWebhook',
      metadata: {
        error_message: error.message?.substring(0, 100),
        correlation_id: correlationId
      }
    }).catch(logErr => console.error('[alz_handlePixWebhook] Log error:', logErr.message));
    
    return errorResponse('INTERNAL_ERROR', 'Erro ao processar webhook.', 500, {
      build_signature: BUILD_SIGNATURE,
      correlation_id: correlationId
    });
  }
});