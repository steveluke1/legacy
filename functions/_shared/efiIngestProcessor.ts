// functions/_shared/efiIngestProcessor.js
// Shared Efí webhook ingestion processor
// Pure function - auth handled by caller, deterministic processing

const BUILD_SIGNATURE = 'efi-ingest-processor-v1-20260107';

/**
 * Process Efí webhook event (exactly-once, idempotent)
 * @param {object} input - { txid, endToEndId?, raw?, receivedAt?, source }
 * @param {object} context - { base44, logger?, correlationId? }
 * @returns {Promise<object>} - { ok, data?, error? }
 */
export async function processEfiIngest(input, context) {
  const { txid, endToEndId, raw, receivedAt, source = 'unknown' } = input;
  const { base44, logger = console, correlationId = 'unknown' } = context;
  
  const now = receivedAt || new Date().toISOString();
  
  try {
    // 1. Validate txid
    if (!txid || typeof txid !== 'string' || txid.trim() === '') {
      return {
        ok: false,
        error: {
          code: 'MISSING_TXID',
          message: 'txid é obrigatório'
        }
      };
    }
    
    logger.log(`[efiIngestProcessor:${correlationId}] PROCESSING txid=${txid.substring(0, 8)}*** source=${source}`);
    
    // 2. Compute payload hash (replay protection)
    const payloadHash = await hashPayload(JSON.stringify({ txid, endToEndId, raw }));
    
    // 3. Check if event already recorded (idempotency)
    const existingEvents = await base44.asServiceRole.entities.EfiWebhookEvent.filter({
      efi_txid: txid,
      payload_hash: payloadHash
    }, undefined, 1);
    
    if (existingEvents.length > 0) {
      logger.log(`[efiIngestProcessor:${correlationId}] DUPLICATE txid=${txid.substring(0, 8)}*** (already processed)`);
      
      return {
        ok: true,
        data: {
          processed: false,
          idempotent: true,
          reason: 'already_recorded',
          build_signature: BUILD_SIGNATURE,
          correlation_id: correlationId
        }
      };
    }
    
    // 4. Record webhook event (idempotent anchor)
    await base44.asServiceRole.entities.EfiWebhookEvent.create({
      provider: 'efi',
      event_type: 'PIX_RECEIVED',
      efi_txid: txid,
      payload_hash: payloadHash,
      payload_json: JSON.stringify({ txid, endToEndId, raw, source }),
      signature: source === 'bridge' ? 'BRIDGE_FORWARDED' : source === 'admin_test' ? 'ADMIN_TEST' : 'UNKNOWN',
      received_at: now
    });
    
    logger.log(`[efiIngestProcessor:${correlationId}] EVENT_RECORDED txid=${txid.substring(0, 8)}***`);
    
    // 5. Fetch payment by txid
    const payments = await base44.asServiceRole.entities.MarketPixPayment.filter({
      efi_txid: txid
    }, undefined, 1);
    
    if (payments.length === 0) {
      logger.warn(`[efiIngestProcessor:${correlationId}] PAYMENT_NOT_FOUND txid=${txid.substring(0, 8)}***`);
      
      // Update event as processed (no payment found)
      const events = await base44.asServiceRole.entities.EfiWebhookEvent.filter({
        efi_txid: txid,
        payload_hash: payloadHash
      }, undefined, 1);
      
      if (events.length > 0) {
        await base44.asServiceRole.entities.EfiWebhookEvent.update(events[0].id, {
          processed_at: now,
          processing_result: 'payment_not_found'
        });
      }
      
      return {
        ok: true,
        data: {
          processed: false,
          reason: 'payment_not_found',
          build_signature: BUILD_SIGNATURE,
          correlation_id: correlationId
        }
      };
    }
    
    const payment = payments[0];
    
    // 6. IDEMPOTENCY: Check if already paid/settled
    if (payment.status === 'paid' || payment.status === 'settled') {
      logger.log(`[efiIngestProcessor:${correlationId}] ALREADY_PROCESSED payment=${payment.id} status=${payment.status}`);
      
      // Update event as processed (idempotent)
      const events = await base44.asServiceRole.entities.EfiWebhookEvent.filter({
        efi_txid: txid,
        payload_hash: payloadHash
      }, undefined, 1);
      
      if (events.length > 0) {
        await base44.asServiceRole.entities.EfiWebhookEvent.update(events[0].id, {
          processed_at: now,
          processing_result: `already_${payment.status}`
        });
      }
      
      return {
        ok: true,
        data: {
          processed: false,
          idempotent: true,
          reason: `already_${payment.status}`,
          payment_id: payment.id,
          build_signature: BUILD_SIGNATURE,
          correlation_id: correlationId
        }
      };
    }
    
    // 7. Mark payment as PAID
    await base44.asServiceRole.entities.MarketPixPayment.update(payment.id, {
      status: 'paid'
    });
    
    logger.log(`[efiIngestProcessor:${correlationId}] MARKED_PAID payment=${payment.id}`);
    
    // 8. Trigger settlement (best-effort, exactly-once via existing idempotency in marketSettlePayment)
    let settled = false;
    let settlementError = null;
    
    try {
      // Build a fake request with system token for marketSettlePayment
      const systemToken = Deno.env.get('MARKET_SYSTEM_TOKEN');
      
      const settlementReq = new Request('http://localhost/api/marketSettlePayment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-market-system-token': systemToken || 'MISSING'
        },
        body: JSON.stringify({ paymentId: payment.id })
      });
      
      const { createClientFromRequest } = await import('npm:@base44/sdk@0.8.6');
      const base44Settlement = createClientFromRequest(settlementReq);
      const settlementRes = await base44Settlement.functions.invoke('marketSettlePayment', {
        paymentId: payment.id
      });
      
      if (!settlementRes.data?.ok) {
        throw new Error(settlementRes.data?.error?.message || 'Settlement failed');
      }
      
      settled = true;
      logger.log(`[efiIngestProcessor:${correlationId}] SETTLED payment=${payment.id}`);
      
    } catch (settlementErr) {
      settlementError = settlementErr.message;
      logger.error(`[efiIngestProcessor:${correlationId}] SETTLEMENT_ERROR payment=${payment.id} error=${settlementError}`);
    }
    
    // 9. Update event with final processing result
    const events = await base44.asServiceRole.entities.EfiWebhookEvent.filter({
      efi_txid: txid,
      payload_hash: payloadHash
    }, undefined, 1);
    
    if (events.length > 0) {
      await base44.asServiceRole.entities.EfiWebhookEvent.update(events[0].id, {
        processed_at: now,
        processing_result: settled ? 'settled' : `error: ${settlementError?.substring(0, 200) || 'unknown'}`
      });
    }
    
    return {
      ok: true,
      data: {
        processed: true,
        payment_id: payment.id,
        settled,
        error: settlementError ? settlementError.substring(0, 100) : undefined,
        build_signature: BUILD_SIGNATURE,
        correlation_id: correlationId
      }
    };
    
  } catch (error) {
    logger.error(`[efiIngestProcessor:${correlationId}] CRITICAL_ERROR: ${error.message}`);
    
    return {
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro ao processar webhook',
        detail: error.message
      }
    };
  }
}

async function hashPayload(payload) {
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}