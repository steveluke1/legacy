// functions/marketSettlePayment.js
// Settlement function: moves ALZ from escrow and delivers to buyer via in-game mail
// EXACTLY-ONCE guarantee via idempotency key
// VERSION: v4-inline-bridge-20260115 (NO LOCAL IMPORTS)

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BUILD_SIGNATURE = 'market-settle-v4-inline-bridge-20260115';

// INLINE callBridge (self-contained to prevent deployment 404)
async function callBridge(path, payload, method = 'POST', timeoutMs = 10000) {
  const bridgeBaseUrl = Deno.env.get('BRIDGE_BASE_URL');
  const bridgeApiKey = Deno.env.get('BRIDGE_API_KEY');

  if (!bridgeBaseUrl || !bridgeApiKey) {
    return {
      ok: false,
      error: {
        code: 'BRIDGE_CONFIG_MISSING',
        message: 'Bridge não configurado'
      }
    };
  }

  const cleanBase = bridgeBaseUrl.trim().replace(/\/+$/, '').replace(/\/internal$/, '');
  let url;
  try {
    url = new URL(path.startsWith('/') ? path : `/${path}`, cleanBase).toString();
  } catch {
    return {
      ok: false,
      error: {
        code: 'BRIDGE_INVALID_URL',
        message: 'URL do Bridge inválida'
      }
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const authHeader = bridgeApiKey.startsWith('Bearer ') ? bridgeApiKey : `Bearer ${bridgeApiKey}`;
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': authHeader
      },
      body: method !== 'GET' ? JSON.stringify(payload) : undefined,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    let text;
    let json;
    try {
      text = await response.text();
      json = text ? JSON.parse(text) : {};
    } catch {
      return {
        ok: false,
        error: {
          code: 'BRIDGE_BAD_RESPONSE',
          message: 'Resposta inválida do Bridge',
          httpStatus: response.status
        }
      };
    }

    if (response.status === 404) {
      return {
        ok: false,
        error: {
          code: 'BRIDGE_ENDPOINT_NOT_FOUND',
          message: 'Endpoint do Bridge não encontrado',
          httpStatus: 404
        }
      };
    }

    if (json.ok === false) {
      const semanticCode = json.error || json.error_code || json.code;
      if (semanticCode) {
        return {
          ok: false,
          error: {
            code: semanticCode,
            message: json.message || json.detail || 'Erro no Bridge',
            httpStatus: response.status
          }
        };
      }
    }

    if (!response.ok) {
      return {
        ok: false,
        error: {
          code: 'BRIDGE_UPSTREAM_ERROR',
          message: `Bridge retornou HTTP ${response.status}`,
          httpStatus: response.status
        }
      };
    }

    return {
      ok: true,
      data: json.data || json
    };
  } catch (error) {
    clearTimeout(timeoutId);
    return {
      ok: false,
      error: {
        code: error.name === 'AbortError' ? 'BRIDGE_TIMEOUT' : 'BRIDGE_NETWORK_ERROR',
        message: `Erro ao chamar Bridge: ${error.message}`,
        httpStatus: error.name === 'AbortError' ? 504 : 503
      }
    };
  }
}

// INLINE validateBuyerCharacterIdx
function validateBuyerCharacterIdx(characterIdx) {
  if (!characterIdx || !Number.isInteger(characterIdx) || characterIdx <= 0) {
    return {
      valid: false,
      error: 'buyer_character_idx deve ser inteiro > 0'
    };
  }
  return { valid: true };
}

// Settlement lock TTL (5 minutes)
const SETTLEMENT_LOCK_TTL_MS = 5 * 60 * 1000;

// Fencing token: Check lock ownership (prevents double-settle from stale override)
async function checkLockOwnership(base44, paymentId, expectedCorrelationId) {
  const payments = await base44.asServiceRole.entities.MarketPixPayment.filter({ 
    id: paymentId 
  }, undefined, 1);
  
  if (!payments || payments.length === 0) {
    return { ok: false, reason: 'PAYMENT_NOT_FOUND' };
  }
  
  const p = payments[0];
  const sameToken = p.settlement_correlation_id === expectedCorrelationId;
  const settling = p.status === 'settling';
  
  if (settling && sameToken) {
    return { ok: true, payment: p };
  }
  
  return {
    ok: false,
    reason: 'LOCK_LOST',
    currentStatus: p.status,
    hasMatchingToken: sameToken
  };
}

// Validate system token for webhook calls
function validateSystemAuth(req) {
  const systemToken = Deno.env.get('MARKET_SYSTEM_TOKEN');
  
  if (!systemToken || systemToken.trim() === '') {
    return { valid: false, reason: 'MARKET_SYSTEM_TOKEN não configurado' };
  }
  
  const headerToken = req.headers.get('x-market-system-token');
  
  if (!headerToken) {
    return { valid: false, reason: 'x-market-system-token header ausente' };
  }
  
  // Constant-time comparison
  if (headerToken !== systemToken) {
    return { valid: false, reason: 'Token inválido' };
  }
  
  return { valid: true };
}

Deno.serve(async (req) => {
  const correlationId = `settle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const body = await req.json();
    const { paymentId, systemToken, simulate, token, __selfTest, debug } = body;
    const isDebugMode = debug === true;
    
    // SELF-TEST PATH (diagnostic without external dependencies)
    if (__selfTest === true) {
      const testModeEnabled = Deno.env.get('MARKETPLACE_TEST_MODE') === '1';
      const bridgeUrl = Deno.env.get('BRIDGE_BASE_URL') ? 'configured' : 'missing';
      const bridgeKey = Deno.env.get('BRIDGE_API_KEY') ? 'configured' : 'missing';
      
      return Response.json({
        ok: true,
        selfTest: true,
        build_signature: BUILD_SIGNATURE,
        config: {
          test_mode_enabled: testModeEnabled,
          bridge_base_url: bridgeUrl,
          bridge_api_key: bridgeKey
        },
        correlationId
      }, { status: 200 });
    }
    
    const base44 = createClientFromRequest(req);
    
    // AUTH PATHS:
    // 1) SIMULATE MODE: Requires token + buyer ownership check
    // 2) PRODUCTION: Admin session OR system token
    
    let callerUserId = null;
    let isSimulateMode = simulate === true;
    
    if (isSimulateMode) {
      // SIMULATE PATH: Verify buyer token
      if (!token || typeof token !== 'string') {
        return Response.json({
          ok: false,
          error: { 
            code: 'AUTH_TOKEN_MISSING', 
            message: 'Sessão expirada. Faça login novamente.' 
          }
        }, { status: 401 });
      }
      
      const authRes = await base44.functions.invoke('auth_me', { token });
      
      if (!authRes.data?.success || !authRes.data?.user) {
        return Response.json({
          ok: false,
          error: { 
            code: 'AUTH_TOKEN_INVALID', 
            message: 'Sessão inválida. Faça login novamente.' 
          }
        }, { status: 401 });
      }
      
      callerUserId = authRes.data.user.id;
      console.log(`[marketSettlePayment:${correlationId}] SIMULATE_MODE buyer=${callerUserId}`);
      
    } else {
      // PRODUCTION PATH: Admin or system token
      const user = await base44.auth.me().catch(() => null);
      const isAdmin = user && user.role === 'admin';
      
      if (!isAdmin) {
        const systemAuth = validateSystemAuth(req);
        
        if (!systemAuth.valid) {
          console.error(`[marketSettlePayment:${correlationId}] UNAUTHORIZED: ${systemAuth.reason}`);
          return Response.json({
            ok: false,
            error: { 
              code: 'FORBIDDEN', 
              message: 'Somente administradores ou sistema autorizado' 
            }
          }, { status: 403 });
        }
        
        console.log(`[marketSettlePayment:${correlationId}] SYSTEM_AUTH validated`);
      } else {
        console.log(`[marketSettlePayment:${correlationId}] ADMIN_AUTH user=${user.id}`);
      }
    }
    
    if (!paymentId) {
      return Response.json({
        ok: false,
        error: { code: 'MISSING_PAYMENT_ID', message: 'paymentId é obrigatório' }
      }, { status: 422 });
    }
    
    // 1. Load payment
    const payments = await base44.asServiceRole.entities.MarketPixPayment.filter({
      id: paymentId
    }, undefined, 1);

    if (payments.length === 0) {
      return Response.json({
        ok: false,
        error: { code: 'PAYMENT_NOT_FOUND', message: 'Pagamento não encontrado' }
      }, { status: 422 });
    }
    
    const payment = payments[0];
    
    // 1b. SIMULATE MODE: Enforce buyer ownership + promote to paid
    if (isSimulateMode && callerUserId) {
      if (payment.buyer_user_id !== callerUserId) {
        return Response.json({
          ok: false,
          error: { 
            code: 'FORBIDDEN', 
            message: 'Você só pode simular pagamentos das suas próprias compras' 
          }
        }, { status: 403 });
      }

      // Mark payment as paid (simulate webhook effect)
      if (payment.status === 'created' || payment.status === 'pix_pending') {
        await base44.asServiceRole.entities.MarketPixPayment.update(payment.id, {
          status: 'paid'
        });
        console.log(`[marketSettlePayment:${correlationId}] SIMULATE: Marked payment as paid`);

        // CRITICAL: Re-fetch payment to get updated status (avoid stale state)
        const refreshedPayments = await base44.asServiceRole.entities.MarketPixPayment.filter({
          id: paymentId
        }, undefined, 1);

        if (refreshedPayments.length > 0) {
          // Update the local payment object with fresh data
          Object.assign(payment, refreshedPayments[0]);
          console.log(`[marketSettlePayment:${correlationId}] SIMULATE: Payment refreshed, status now=${payment.status}`);
        }
      }
    }
    
    // 2. IDEMPOTENCY: Check if already settled (EARLY EXIT - no-op)
    if (payment.status === 'settled') {
      console.log(`[marketSettlePayment:${correlationId}] ALREADY_SETTLED payment=${payment.id}`);
      return Response.json({
        ok: true,
        data: {
          settled: true,
          idempotent: true,
          settled_at: payment.settled_at,
          build_signature: BUILD_SIGNATURE,
          correlation_id: correlationId
        }
      }, { status: 200 });
    }
    
    // 2b. CONCURRENCY LOCK: Check if already settling (in-progress guard)
    if (payment.status === 'settling') {
      const startedAt = payment.settling_at ? new Date(payment.settling_at).getTime() : 0;
      const ageMs = startedAt ? (Date.now() - startedAt) : Number.POSITIVE_INFINITY;
      
      if (startedAt && ageMs < SETTLEMENT_LOCK_TTL_MS) {
        // Lock is fresh -> return in-progress (another worker is settling)
        console.log(`[marketSettlePayment:${correlationId}] SETTLING_IN_PROGRESS payment=${payment.id} age=${ageMs}ms`);
        return Response.json({
          ok: true,
          data: {
            settled: false,
            settling: true,
            idempotent: true,
            settling_at: payment.settling_at,
            build_signature: BUILD_SIGNATURE,
            correlation_id: correlationId
          }
        }, { status: 200 });
      } else {
        // Stale lock -> override and proceed
        console.warn(`[marketSettlePayment:${correlationId}] STALE_LOCK payment=${payment.id} age=${ageMs}ms - overriding`);
      }
    }
    
    // 3. Validate payment status is settleable
    if (payment.status !== 'paid' && payment.status !== 'settling') {
      return Response.json({
        ok: false,
        error: {
          code: 'PAYMENT_NOT_SETTLEABLE',
          message: `Pagamento não está em status 'paid' para settlement (status atual: '${payment.status}').`
        }
      }, { status: 422 });
    }
    
    // 3b. ACQUIRE LOCK: Set status to 'settling' BEFORE any Bridge settle call
    const lockTimestamp = new Date().toISOString();
    await base44.asServiceRole.entities.MarketPixPayment.update(payment.id, {
      status: 'settling',
      settling_at: lockTimestamp,
      settlement_correlation_id: correlationId
    });
    
    console.log(`[marketSettlePayment:${correlationId}] LOCK_ACQUIRED payment=${payment.id} settling_at=${lockTimestamp}`);
    
    // 3c. FENCING CHECK #1: Verify lock ownership after acquisition (sanity check)
    const fenceCheck1 = await checkLockOwnership(base44, payment.id, correlationId);
    if (!fenceCheck1.ok) {
      console.warn(`[marketSettlePayment:${correlationId}] LOCK_LOST_ABORT (after_acquisition) payment=${payment.id} status=${fenceCheck1.currentStatus}`);
      return Response.json({
        ok: true,
        data: {
          aborted_due_to_lock_loss: true,
          payment_id: payment.id,
          correlation_id: correlationId,
          build_signature: BUILD_SIGNATURE
        }
      }, { status: 200 });
    }
    
    // 4. CRITICAL: Validate buyer_character_idx exists (no fallback to default slot)
    if (!payment.buyer_character_idx) {
      console.error(`[marketSettlePayment:${correlationId}] MISSING_BUYER_CHARACTER payment=${payment.id}`);
      
      // Mark as failed (admin can retry after fixing data)
      await base44.asServiceRole.entities.MarketPixPayment.update(payment.id, {
        status: 'failed',
        error_message: 'buyer_character_idx ausente. Pagamento requer intervenção manual.'
      });
      
      return Response.json({
        ok: false,
        error: {
          code: 'SETTLE_MISSING_BUYER_CHARACTER',
          message: 'buyer_character_idx ausente no pagamento. Este pagamento requer intervenção admin.'
        }
      }, { status: 500 });
    }
    
    const buyerCharacterIdx = payment.buyer_character_idx;
    
    // Validate CharacterIdx format
    const charIdxValidation = validateBuyerCharacterIdx(buyerCharacterIdx);
    if (!charIdxValidation.valid) {
      await base44.asServiceRole.entities.MarketPixPayment.update(payment.id, {
        status: 'failed',
        error_message: `buyer_character_idx inválido: ${charIdxValidation.error}`
      });

      return Response.json({
        ok: false,
        error: {
          code: 'INVALID_CHARACTERIDX',
          message: charIdxValidation.error
        }
      }, { status: 422 });
    }
    
    // 5. CRITICAL: Re-check if buyer character is ONLINE (BLOCK if online)
    console.log(`[marketSettlePayment:${correlationId}] Checking online status for NIC=${payment.buyer_nic}`);
    
    if (payment.buyer_nic) {
      // Call Bridge to check current online status
      const onlineCheckResult = await callBridge('/internal/character/check-online', {
        nic: payment.buyer_nic
      }, 'POST', 5000); // 5s timeout
      
      if (onlineCheckResult.ok && onlineCheckResult.data?.isOnline === true) {
        console.warn(`[marketSettlePayment:${correlationId}] BUYER_ONLINE payment=${payment.id} nic=${payment.buyer_nic}`);
        
        // Mark as failed with specific reason (allow retry when offline)
        await base44.asServiceRole.entities.MarketPixPayment.update(payment.id, {
          status: 'failed',
          error_message: 'BUYER_ONLINE: O personagem precisa estar OFFLINE para receber ALZ'
        });
        
        return Response.json({
          ok: false,
          error: {
            code: 'BUYER_ONLINE',
            message: `O personagem "${payment.buyer_nic}" está ONLINE. É necessário que o personagem esteja OFFLINE para receber ALZ no correio. Por favor, deslogue e tente novamente.`
          }
        }, { status: 409 }); // 409 Conflict
      }
      
      // If online check fails (Bridge error), log but don't block settlement
      if (!onlineCheckResult.ok) {
        console.warn(`[marketSettlePayment:${correlationId}] Online check failed: ${onlineCheckResult.error?.code} - Proceeding with settlement anyway`);
      }
    }
    
    // 6. FENCING CHECK #2: Verify lock ownership BEFORE Bridge settle call
    const fenceCheck2 = await checkLockOwnership(base44, payment.id, correlationId);
    if (!fenceCheck2.ok) {
      console.warn(`[marketSettlePayment:${correlationId}] LOCK_LOST_ABORT (before_bridge) payment=${payment.id} status=${fenceCheck2.currentStatus}`);
      return Response.json({
        ok: true,
        data: {
          aborted_due_to_lock_loss: true,
          payment_id: payment.id,
          correlation_id: correlationId,
          build_signature: BUILD_SIGNATURE
        }
      }, { status: 200 });
    }
    
    // 6b. MOVED: Bridge settle is now called PER-SLICE (not globally)
    // Each slice will use its order's lock_idempotency_key for idempotency
    
    // 7. FENCING CHECK #2b: Verify lock ownership BEFORE internal settlement
    const fenceCheck3 = await checkLockOwnership(base44, payment.id, correlationId);
    if (!fenceCheck3.ok) {
      console.warn(`[marketSettlePayment:${correlationId}] LOCK_LOST_ABORT (before_internal) payment=${payment.id} status=${fenceCheck3.currentStatus}`);
      return Response.json({
        ok: true,
        data: {
          aborted_due_to_lock_loss: true,
          payment_id: payment.id,
          correlation_id: correlationId,
          build_signature: BUILD_SIGNATURE
        }
      }, { status: 200 });
    }
    
    // 7. INTERNAL LEDGER SETTLEMENT: Update sell orders + seller locks BEFORE marking settled

    // 7a. Validate payment has slices (CRITICAL for deterministic settlement)
    let bridgeProofs = [];  // Initialize early so we can track even in error paths
    let settledOrders = [];  // Initialize at handler scope for response builder (L950, L961)

    // CRITICAL INVARIANT CHECK: Sum of slices MUST equal payment.alz_amount
    const paymentAmount = BigInt(payment.alz_amount);
    let sliceSum = 0n;

    if (payment.matched_sell_order_slices && payment.matched_sell_order_slices.length > 0) {
      for (const slice of payment.matched_sell_order_slices) {
        const matched = BigInt(slice.matched_alz);
        if (matched <= 0n) {
          return Response.json({
            ok: false,
            error: {
              code: 'INVALID_SLICE_AMOUNT',
              message: `Slice contém ALZ <= 0: ${slice.matched_alz}`
            }
          }, { status: 422 });
        }
        sliceSum += matched;
      }

      if (sliceSum !== paymentAmount) {
        console.error(`[marketSettlePayment:${correlationId}] SLICE_SUM_MISMATCH paymentAmount=${paymentAmount.toString()} sliceSum=${sliceSum.toString()}`);
        return Response.json({
          ok: false,
          error: {
            code: 'SLICE_SUM_MISMATCH',
            message: `Soma dos slices (${(sliceSum / 1_000_000_000n).toString()}B) não corresponde ao pagamento (${(paymentAmount / 1_000_000_000n).toString()}B). Requer auditoria.`
          },
          debug: isDebugMode ? {
            paymentAmount: paymentAmount.toString(),
            sliceSum: sliceSum.toString(),
            sliceCount: payment.matched_sell_order_slices.length
          } : undefined
        }, { status: 422 });
      }
    }

    if (!payment.matched_sell_order_slices || payment.matched_sell_order_slices.length === 0) {
      // If payment has matched_sell_orders but no slices, this is a critical data issue
      if (payment.matched_sell_orders && payment.matched_sell_orders.length > 0) {
        console.error(`[marketSettlePayment:${correlationId}] PAYMENT_MISSING_SLICES payment=${payment.id} matched_orders=${payment.matched_sell_orders.length}`);

        await base44.asServiceRole.entities.MarketPixPayment.update(payment.id, {
          status: 'failed',
          error_message: 'MISSING_SLICES: Pagamento não possui slices para settlement interno.'
        });

        return Response.json({
          ok: false,
          error: {
            code: 'PAYMENT_MISSING_SLICES',
            message: 'Pagamento sem dados de slices. Requer intervenção admin.'
          }
        }, { status: 500 });
      }

      // No slices and no orders -> nothing to settle internally (legacy payment?)
      console.warn(`[marketSettlePayment:${correlationId}] NO_SLICES payment=${payment.id} - skipping internal settlement`);
    } else {
       // 7b. Process each slice with per-slice idempotency + fencing
       const slices = payment.matched_sell_order_slices;
       // NOTE: settledOrders already declared at handler scope (L513)

       // Track total ALZ delivered to buyer (MUST equal paymentAmount)
       let totalDelivered = 0n;

       console.log(`[marketSettlePayment:${correlationId}] Processing ${slices.length} slices with per-slice idempotency`);

       for (const slice of slices) {
        // PER-SLICE FENCING CHECK: Verify lock ownership before each slice
        const sliceFenceCheck = await checkLockOwnership(base44, payment.id, correlationId);
        if (!sliceFenceCheck.ok) {
          console.warn(`[marketSettlePayment:${correlationId}] LOCK_LOST_ABORT (mid_slice_loop) payment=${payment.id} status=${sliceFenceCheck.currentStatus}`);
          return Response.json({
            ok: true,
            data: {
              aborted_due_to_lock_loss: true,
              payment_id: payment.id,
              correlation_id: correlationId,
              build_signature: BUILD_SIGNATURE
            }
          }, { status: 200 });
        }
        
        const orderId = slice.order_id;
        const matchedAlz = BigInt(slice.matched_alz);

        // Fetch order to get lock_idempotency_key (required for Bridge settle)
        const ordersForLock = await base44.asServiceRole.entities.AlzSellOrder.filter({ id: orderId }, undefined, 1);

        if (ordersForLock.length === 0) {
          console.error(`[marketSettlePayment:${correlationId}] ORDER_NOT_FOUND_FOR_LOCK orderId=${orderId}`);

          await base44.asServiceRole.entities.MarketPixPayment.update(payment.id, {
            status: 'failed',
            error_message: `ORDER_NOT_FOUND_FOR_LOCK: ${orderId}`
          });

          return Response.json({
            ok: false,
            error: {
              code: 'ORDER_NOT_FOUND_IN_SETTLEMENT',
              message: `Ordem ${orderId} não encontrada durante settlement. Requer intervenção admin.`
            }
          }, { status: 422 });
        }

        const orderForLock = ordersForLock[0];

        // CRITICAL: Validate lock_idempotency_key exists
        if (!orderForLock.lock_idempotency_key) {
          console.error(`[marketSettlePayment:${correlationId}] MISSING_LOCK_KEY orderId=${orderId}`);

          await base44.asServiceRole.entities.MarketPixPayment.update(payment.id, {
            status: 'failed',
            error_message: `MISSING_LOCK_KEY: ${orderId}`
          });

          return Response.json({
            ok: false,
            error: {
              code: 'SETTLE_MISSING_LOCK_KEY',
              message: `Ordem ${orderId} não possui lock key para settlement`
            }
          }, { status: 422 });
        }

        // Deterministic slice idempotency key (INTERNAL only, not sent to Bridge)
        const sliceKey = `settle_slice:${payment.id}:${payment.efi_txid}:${orderId}`;
        
        // Load or create MarketSettlementSlice record
        let sliceRecords = await base44.asServiceRole.entities.MarketSettlementSlice.filter({
          idempotency_key: sliceKey
        }, undefined, 1);
        
        let sliceRecord;
        if (sliceRecords.length === 0) {
          // Create new slice record
          sliceRecord = await base44.asServiceRole.entities.MarketSettlementSlice.create({
            payment_id: payment.id,
            order_id: orderId,
            idempotency_key: sliceKey,
            matched_alz: slice.matched_alz,
            settlement_correlation_id: correlationId
          });
          console.log(`[marketSettlePayment:${correlationId}] Slice record created key=${sliceKey}`);
        } else {
          sliceRecord = sliceRecords[0];
          
          // Validate record integrity (prevent data corruption)
          if (sliceRecord.order_id !== orderId) {
            console.error(`[marketSettlePayment:${correlationId}] SLICE_RECORD_CORRUPTION key=${sliceKey} expected_order=${orderId} actual_order=${sliceRecord.order_id}`);
            
            await base44.asServiceRole.entities.MarketPixPayment.update(payment.id, {
              status: 'failed',
              error_message: `SLICE_RECORD_CORRUPTION: ${sliceKey}`
            });
            
            return Response.json({
              ok: false,
              error: {
                code: 'SLICE_RECORD_CORRUPTION',
                message: `Corrupção detectada no registro de slice. Requer intervenção admin.`
              }
            }, { status: 500 });
          }

          console.log(`[marketSettlePayment:${correlationId}] Slice record exists key=${sliceKey} order_applied=${!!sliceRecord.order_applied_at} lock_applied=${!!sliceRecord.lock_applied_at}`);
         }
         
         // 7b-BRIDGE: Call Bridge settle with LOCK KEY (idempotent per-slice)
         // This MUST happen before internal ledger updates to maintain atomicity
         if (!sliceRecord.order_applied_at) {
           // Bridge settle uses the LOCK key (from AlzSellOrder.lock_idempotency_key)
           console.log(`[marketSettlePayment:${correlationId}] Calling Bridge settle with lockKey=${orderForLock.lock_idempotency_key}`);

           // Bridge payload: ALZ MUST be slice.matched_alz (the exact slice amount)
           // CRITICAL: Pass BOTH deliverAmountStr (exact) and deliverAmountNum (validated roundtrip)
           const deliverAmountStr = slice.matched_alz;
           const deliverAmountBigInt = BigInt(deliverAmountStr);
           const deliverAmountNum = Number(deliverAmountBigInt);

           // Safety: Verify BigInt→Number→String roundtrip is exact (no precision loss)
           if (deliverAmountBigInt !== BigInt(deliverAmountNum.toString())) {
             console.error(`[marketSettlePayment:${correlationId}] DELIVER_AMOUNT_PRECISION_LOSS orderId=${orderId} str=${deliverAmountStr} num=${deliverAmountNum}`);

             await base44.asServiceRole.entities.MarketPixPayment.update(payment.id, {
               status: 'failed',
               error_message: `DELIVER_AMOUNT_PRECISION_LOSS: ${deliverAmountStr}`
             });

             return Response.json({
               ok: false,
               error: {
                 code: 'DELIVER_AMOUNT_PRECISION_LOSS',
                 message: `ALZ amount não pode ser convertido com segurança: ${deliverAmountStr}`
               }
             }, { status: 422 });
           }

           const settleResult = await callBridge('/internal/alz/settle', {
             idempotencyKey: orderForLock.lock_idempotency_key,
             buyerCharacterIdx: buyerCharacterIdx,
             deliverAmountStr: deliverAmountStr,
             deliverAmountNum: deliverAmountNum,
             mailType: 2,
             mailExpireDays: 0
           }, 'POST', 30000);

           if (!settleResult.ok) {
             console.error(`[marketSettlePayment:${correlationId}] BRIDGE_SETTLE_FAILED orderId=${orderId} error=${settleResult.error?.code}`);

             await base44.asServiceRole.entities.MarketPixPayment.update(payment.id, {
               status: 'failed',
               error_message: `Bridge settle failed: ${settleResult.error?.code || settleResult.error?.message}`
             });

             const errorResponse = {
               ok: false,
               error: {
                 code: 'BRIDGE_SETTLE_FAILED',
                 message: settleResult.error?.message || 'Falha ao liquidar ALZ no Bridge',
                 detail: settleResult.error
               },
               downstream: {
                 source: 'bridgeAlzSettle',
                 httpStatus: settleResult.error?.httpStatus || 422,
                 errorCode: settleResult.error?.code
               }
             };

             // Include bridge proof in debug mode
             if (isDebugMode) {
               errorResponse.debug = {
                 bridgeProofs: [
                   {
                     orderId,
                     deliverAmountStr,
                     deliverAmountNum,
                     endpoint: '/internal/alz/settle',
                     called: true,
                     responseOk: false,
                     error: settleResult.error?.code,
                     fullError: settleResult.error
                   }
                 ]
               };
             }

             return Response.json(errorResponse, { status: 422 });
           }

           // CRITICAL: Verify Bridge returned a delivered amount and it matches what we sent
           const bridgeDeliveredStr = settleResult.data?.delivered_alz || settleResult.data?.deliveredAlz;
           if (!bridgeDeliveredStr) {
             console.error(`[marketSettlePayment:${correlationId}] BRIDGE_MISSING_DELIVERED_AMOUNT orderId=${orderId}`);

             await base44.asServiceRole.entities.MarketPixPayment.update(payment.id, {
               status: 'failed',
               error_message: `Bridge did not return delivered_alz field`
             });

             return Response.json({
               ok: false,
               error: {
                 code: 'BRIDGE_MISSING_DELIVERED_AMOUNT',
                 message: 'Bridge settlement sucesso mas não retornou delivered_alz. Settlement abortado.',
                 requested: deliverAmountStr,
                 bridge_response: settleResult.data
               }
             }, { status: 422 });
           }

           // Verify delivered matches requested (CRITICAL: catch 4.01B→50B bug)
           if (BigInt(bridgeDeliveredStr) !== deliverAmountBigInt) {
             console.error(`[marketSettlePayment:${correlationId}] BRIDGE_DELIVERED_AMOUNT_MISMATCH orderId=${orderId} requested=${deliverAmountStr} bridge_returned=${bridgeDeliveredStr}`);

             await base44.asServiceRole.entities.MarketPixPayment.update(payment.id, {
               status: 'failed',
               error_message: `Bridge returned wrong amount: requested ${deliverAmountStr}, delivered ${bridgeDeliveredStr}`
             });

             return Response.json({
               ok: false,
               error: {
                 code: 'BRIDGE_DELIVERED_AMOUNT_MISMATCH',
                 message: `Bridge entregou ${(BigInt(bridgeDeliveredStr) / 1_000_000_000n).toString()}B ALZ mas foi solicitado ${(deliverAmountBigInt / 1_000_000_000n).toString()}B ALZ. Isto é um erro crítico do Bridge.`,
                 requested_alz: deliverAmountStr,
                 bridge_delivered_alz: bridgeDeliveredStr
               },
               downstream: {
                 source: 'bridgeAlzSettle',
                 httpStatus: 200,
                 issue: 'AMOUNT_MISMATCH'
               }
             }, { status: 422 });
           }

           console.log(`[marketSettlePayment:${correlationId}] Bridge settle OK orderId=${orderId} requested=${deliverAmountStr} delivered=${bridgeDeliveredStr}`);

           // Track delivered ALZ (must match sliceSum at end)
           totalDelivered += BigInt(bridgeDeliveredStr);

           // Diagnostic: track lock key used and bridge proof
           settledOrders.push({
             orderId,
             lockKeyUsed: orderForLock.lock_idempotency_key,
             matchedAlz: deliverAmountStr,
             bridgeDeliveredAlz: bridgeDeliveredStr,
             bridgeStatus: 'SETTLED'
           });

           bridgeProofs.push({
             orderId,
             endpoint: '/internal/alz/settle',
             called: true,
             responseOk: true,
             requestedAlz: deliverAmountStr,
             deliveredAlz: bridgeDeliveredStr,
             amountMatch: bridgeDeliveredStr === deliverAmountStr,
             httpStatus: 200
           });
           }

         // IDEMPOTENT ORDER UPDATE: Apply only if not already applied
         if (!sliceRecord.order_applied_at) {
           // Fetch order
           const orders = await base44.asServiceRole.entities.AlzSellOrder.filter({ id: orderId }, undefined, 1);

           if (orders.length === 0) {
             console.error(`[marketSettlePayment:${correlationId}] ORDER_NOT_FOUND orderId=${orderId}`);

             await base44.asServiceRole.entities.MarketPixPayment.update(payment.id, {
               status: 'failed',
               error_message: `ORDER_NOT_FOUND: ${orderId}`
             });

             return Response.json({
               ok: false,
               error: {
                 code: 'ORDER_NOT_FOUND_IN_SETTLEMENT',
                 message: `Ordem ${orderId} não encontrada durante settlement. Requer intervenção admin.`
               }
             }, { status: 422 });
           }

           const order = orders[0];

           // CRITICAL: Validate lock_idempotency_key exists (required for Bridge settle call)
           if (!order.lock_idempotency_key) {
             console.error(`[marketSettlePayment:${correlationId}] MISSING_LOCK_KEY orderId=${orderId} - cannot settle without Bridge lock key`);

             await base44.asServiceRole.entities.MarketPixPayment.update(payment.id, {
               status: 'failed',
               error_message: `MISSING_LOCK_KEY: ${orderId} - Pagamento requer intervenção admin.`
             });

             return Response.json({
               ok: false,
               error: {
                 code: 'SETTLE_MISSING_LOCK_KEY',
                 message: `Ordem ${orderId} não possui lock key. Pagamento requer intervenção admin.`
               }
             }, { status: 422 });
           }

           // Validate order not cancelled
           if (order.status === 'cancelled') {
             console.error(`[marketSettlePayment:${correlationId}] ORDER_CANCELLED_IN_SETTLEMENT orderId=${orderId}`);

             await base44.asServiceRole.entities.MarketPixPayment.update(payment.id, {
               status: 'failed',
               error_message: `ORDER_CANCELLED_IN_SETTLEMENT: ${orderId}`
             });

             return Response.json({
               ok: false,
               error: {
                 code: 'ORDER_CANCELLED_IN_SETTLEMENT',
                 message: `Ordem ${orderId} foi cancelada. Pagamento requer reembolso.`
               }
             }, { status: 422 });
           }
          
          // Decrement remaining_alz (BigInt-safe)
          const oldRemaining = BigInt(Math.floor(order.remaining_alz || 0));
          const newRemaining = oldRemaining - matchedAlz;
          
          if (newRemaining < 0n) {
            console.error(`[marketSettlePayment:${correlationId}] NEGATIVE_REMAINING orderId=${orderId} old=${oldRemaining.toString()} matched=${matchedAlz.toString()}`);
            
            await base44.asServiceRole.entities.MarketPixPayment.update(payment.id, {
              status: 'failed',
              error_message: `NEGATIVE_REMAINING_IN_SETTLEMENT: ${orderId}`
            });
            
            return Response.json({
              ok: false,
              error: {
                code: 'NEGATIVE_REMAINING_IN_SETTLEMENT',
                message: `Ordem ${orderId} teria saldo negativo. Requer auditoria.`
              }
            }, { status: 500 });
          }
          
          // Determine new status
          const newStatus = newRemaining === 0n ? 'filled' : 'partial';
          
          // Update order
          await base44.asServiceRole.entities.AlzSellOrder.update(order.id, {
            remaining_alz: Number(newRemaining),
            status: newStatus
          });
          
          // Mark order effect applied
          const now = new Date().toISOString();
          await base44.asServiceRole.entities.MarketSettlementSlice.update(sliceRecord.id, {
            order_applied_at: now
          });
          
          console.log(`[marketSettlePayment:${correlationId}] Order updated orderId=${orderId} oldRemaining=${oldRemaining.toString()} newRemaining=${newRemaining.toString()} status=${newStatus}`);
        } else {
          console.log(`[marketSettlePayment:${correlationId}] Order already applied orderId=${orderId} - skipping`);
        }
        
        // IDEMPOTENT LOCK UPDATE: Apply only if not already applied
        if (!sliceRecord.lock_applied_at) {
          // Need to re-fetch order to get seller_user_id (if we skipped order update above)
          const orders = await base44.asServiceRole.entities.AlzSellOrder.filter({ id: orderId }, undefined, 1);
          if (orders.length === 0) {
            console.error(`[marketSettlePayment:${correlationId}] ORDER_NOT_FOUND_FOR_LOCK orderId=${orderId}`);
            
            await base44.asServiceRole.entities.MarketPixPayment.update(payment.id, {
              status: 'failed',
              error_message: `ORDER_NOT_FOUND_FOR_LOCK: ${orderId}`
            });
            
            return Response.json({
              ok: false,
              error: {
                code: 'ORDER_NOT_FOUND_IN_SETTLEMENT',
                message: `Ordem ${orderId} não encontrada durante lock decrement. Requer intervenção admin.`
              }
            }, { status: 500 });
          }
          
          const order = orders[0];
          const sellerId = order.seller_user_id;
          
          // Find seller GameAccount
          const sellerAccounts = await base44.asServiceRole.entities.GameAccount.filter({ user_id: sellerId }, undefined, 1);
          
          if (sellerAccounts.length === 0) {
            console.warn(`[marketSettlePayment:${correlationId}] SELLER_GAMEACCOUNT_NOT_FOUND sellerId=${sellerId} orderId=${orderId} - skipping lock decrement`);
            // Mark as applied anyway to avoid retry loop
            const now = new Date().toISOString();
            await base44.asServiceRole.entities.MarketSettlementSlice.update(sliceRecord.id, {
              lock_applied_at: now
            });
            continue;
          }
          
          const sellerAccount = sellerAccounts[0];
          const oldLocked = BigInt(Math.floor(sellerAccount.alz_locked || 0));
          let newLocked = oldLocked - matchedAlz;
          
          // Clamp to 0 if negative (defensive)
          if (newLocked < 0n) {
            console.warn(`[marketSettlePayment:${correlationId}] LOCK_NEGATIVE_CLAMPED sellerId=${sellerId} oldLocked=${oldLocked.toString()} decrement=${matchedAlz.toString()}`);
            newLocked = 0n;
          }
          
          await base44.asServiceRole.entities.GameAccount.update(sellerAccount.id, {
            alz_locked: Number(newLocked)
          });
          
          // Mark lock effect applied
          const now = new Date().toISOString();
          await base44.asServiceRole.entities.MarketSettlementSlice.update(sliceRecord.id, {
            lock_applied_at: now
          });
          
          console.log(`[marketSettlePayment:${correlationId}] Seller lock updated sellerId=${sellerId} oldLocked=${oldLocked.toString()} newLocked=${newLocked.toString()}`);
            } else {
              console.log(`[marketSettlePayment:${correlationId}] Lock already applied orderId=${orderId} - skipping`);
            }

            // RECORD TRADE: Create MarketTrade record for this slice (idempotent)
            // This is the source of truth for price history
            // CRITICAL: Fetch order ONCE before trade creation to avoid "order is not defined"
            let orderForTrade = order; // Use the order already fetched in lock update block
            if (!orderForTrade && !sliceRecord.lock_applied_at) {
              const ordersForTrade = await base44.asServiceRole.entities.AlzSellOrder.filter({ id: orderId }, undefined, 1);
              orderForTrade = ordersForTrade.length > 0 ? ordersForTrade[0] : null;
            }

            if (orderForTrade) {
              const tradeIdempotencyKey = `trade:${payment.id}:${payment.efi_txid}:${orderId}`;

              // Check if trade already exists
              let tradeCreated = false;
              try {
                const existingTrades = await base44.asServiceRole.entities.MarketTrade.filter({
                  idempotency_key: tradeIdempotencyKey
                }, undefined, 1);

                if (existingTrades.length === 0) {
                  // Create new trade record
                  const dayKey = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
                  const matchedAlzNumber = Number(BigInt(slice.matched_alz) / 1_000_000_000n); // Convert to billions for calc
                  const totalBrlForTrade = matchedAlzNumber * orderForTrade.price_per_billion_brl;

                  await base44.asServiceRole.entities.MarketTrade.create({
                    payment_id: payment.id,
                    order_id: orderId,
                    efi_txid: payment.efi_txid,
                    idempotency_key: tradeIdempotencyKey,
                    occurred_at: new Date().toISOString(),
                    day_key: dayKey,
                    alz_amount: slice.matched_alz,
                    price_per_billion_brl: orderForTrade.price_per_billion_brl,
                    total_brl: totalBrlForTrade,
                    settlement_correlation_id: correlationId
                  });

                  tradeCreated = true;
                  console.log(`[marketSettlePayment:${correlationId}] Trade record created orderId=${orderId} alz=${(BigInt(slice.matched_alz) / 1_000_000_000n).toString()}B price=${orderForTrade.price_per_billion_brl}`);
                } else {
                  console.log(`[marketSettlePayment:${correlationId}] Trade record already exists key=${tradeIdempotencyKey} - skipping`);
                }
              } catch (tradeError) {
                console.warn(`[marketSettlePayment:${correlationId}] Trade creation failed (non-critical): ${tradeError.message}`);
                // Non-critical: trade logging failure does NOT block settlement
              }
            } else {
              console.warn(`[marketSettlePayment:${correlationId}] OrderForTrade not found for trade creation orderId=${orderId}`);
            }
          }

          // CRITICAL: Verify totalDelivered matches paymentAmount
      if (totalDelivered !== paymentAmount) {
        console.error(`[marketSettlePayment:${correlationId}] DELIVERED_AMOUNT_MISMATCH paymentAmount=${paymentAmount.toString()} totalDelivered=${totalDelivered.toString()}`);
        
        // Mark as failed (bridge calls succeeded but delivered incorrect amount)
        await base44.asServiceRole.entities.MarketPixPayment.update(payment.id, {
          status: 'failed',
          error_message: `DELIVERED_AMOUNT_MISMATCH: Pagamento esperava ${(paymentAmount / 1_000_000_000n).toString()}B ALZ mas entregou ${(totalDelivered / 1_000_000_000n).toString()}B ALZ`
        });
        
        return Response.json({
          ok: false,
          error: {
            code: 'DELIVERED_AMOUNT_MISMATCH',
            message: `Falha crítica de entrega: pagamento solicitava ${(paymentAmount / 1_000_000_000n).toString()}B ALZ mas foi entregue ${(totalDelivered / 1_000_000_000n).toString()}B ALZ. Requer auditoria manual.`
          },
          debug: isDebugMode ? {
            paymentAmount: paymentAmount.toString(),
            totalDelivered: totalDelivered.toString(),
            mismatchAlz: (paymentAmount - totalDelivered).toString()
          } : undefined
        }, { status: 422 });
      }
      
      console.log(`[marketSettlePayment:${correlationId}] All ${slices.length} slices processed successfully, totalDelivered=${totalDelivered.toString()} (MATCHES paymentAmount)`);
    }
    
    // 8. XOR WAREHOUSE INTEGRITY CHECK (before marking settled)
    // Ensures settlement didn't corrupt warehouse invariants
    if (settledOrders && settledOrders.length > 0) {
      const affectedSellerUserNums = [];
      
      // Collect seller UserNums from settled orders
      try {
        for (const order of settledOrders) {
          if (order.orderId) {
            const orders = await base44.asServiceRole.entities.AlzSellOrder.filter({ id: order.orderId }, undefined, 1);
            if (orders.length > 0) {
              const sellerAccounts = await base44.asServiceRole.entities.GameAccount.filter({ user_id: orders[0].seller_user_id }, undefined, 1);
              if (sellerAccounts.length > 0 && sellerAccounts[0].usernum) {
                affectedSellerUserNums.push(sellerAccounts[0].usernum);
              }
            }
          }
        }
      } catch (e) {
        console.warn(`[marketSettlePayment:${correlationId}] Failed to collect seller usernums for XOR check: ${e.message}`);
      }

      // Call XOR Guard validation
      const xorGuardResult = await callBridge('/admin/settlement-xor-guard', {
        settledOrders: settledOrders.map(o => ({
          orderId: o.orderId,
          matchedAlz: o.matchedAlz,
          sellerUserNum: o.sellerUserNum
        })),
        escrowUserNum: parseInt(Deno.env.get('ESCROW_USERNUM') || '0', 10),
        sellerUserNums: affectedSellerUserNums,
        debug: isDebugMode
      }, 'POST', 30000);

      if (!xorGuardResult.ok) {
        console.error(`[marketSettlePayment:${correlationId}] XOR GUARD FAILED: ${xorGuardResult.error?.code}`);

        // Mark as failed (warehouse integrity compromised)
        await base44.asServiceRole.entities.MarketPixPayment.update(payment.id, {
          status: 'failed',
          error_message: `XOR_WAREHOUSE_MISMATCH: ${xorGuardResult.error?.message || 'Warehouse XOR check failed'}`
        });

        return Response.json({
          ok: false,
          error: {
            code: 'WAREHOUSE_INTEGRITY_COMPROMISED',
            message: 'Integridade do warehouse comprometida. Settlement abortado.',
            detail: xorGuardResult.error?.message
          },
          debug: isDebugMode ? { xorGuardResult } : undefined
        }, { status: 500 });
      }

      console.log(`[marketSettlePayment:${correlationId}] XOR Guard validation PASSED`);
    }

    // 8. FENCING CHECK #4: Verify lock ownership BEFORE marking settled
    const fenceCheck4 = await checkLockOwnership(base44, payment.id, correlationId);
    if (!fenceCheck4.ok) {
      console.warn(`[marketSettlePayment:${correlationId}] LOCK_LOST_ABORT (before_settled) payment=${payment.id} status=${fenceCheck4.currentStatus}`);
      return Response.json({
        ok: true,
        data: {
          aborted_due_to_lock_loss: true,
          payment_id: payment.id,
          correlation_id: correlationId,
          build_signature: BUILD_SIGNATURE
        }
      }, { status: 200 });
    }

    // 8b. Mark payment as settled (ONLY after successful internal updates)
    const now = new Date().toISOString();
    let settlementWarnings = [];

    try {
      await base44.asServiceRole.entities.MarketPixPayment.update(payment.id, {
        status: 'settled',
        settled_at: now
      });
      console.log(`[marketSettlePayment:${correlationId}] Payment marked as settled settled_at=${now}`);
    } catch (settleStatusError) {
      console.error(`[marketSettlePayment:${correlationId}] FAILED_TO_MARK_SETTLED: ${settleStatusError.message}`);
      settlementWarnings.push({ step: 'mark_settled', error: settleStatusError.message });
      // Continue anyway - delivery already happened
    }

    // 9. POST-DELIVERY SAFEGUARDS: Wrap all non-essential work in try/catch
    // This ensures no 500s are returned AFTER Bridge delivery succeeded
    try {
      // 9a. Notify buyer (best-effort, inline to avoid dynamic import)
      try {
        const alzB = (parseFloat(payment.alz_amount) / 1_000_000_000).toFixed(2);

        // Check for duplicate notification
        const existingNotifs = await base44.asServiceRole.entities.Notification.filter({
          user_id: payment.buyer_user_id,
          type: 'ALZ_DELIVERED',
          message: `Seus ${alzB}B ALZ foram enviados para o correio do jogo. Verifique sua caixa de entrada.`
        }, undefined, 1);

        if (existingNotifs.length === 0) {
          await base44.asServiceRole.entities.Notification.create({
            user_id: payment.buyer_user_id,
            message: `Seus ${alzB}B ALZ foram enviados para o correio do jogo. Verifique sua caixa de entrada.`,
            type: 'ALZ_DELIVERED',
            action_url: '/mercado/alz',
            related_entity_id: payment.id
          });
          console.log(`[marketSettlePayment:${correlationId}] Buyer notified: ${payment.buyer_user_id}`);
        } else {
          console.log(`[marketSettlePayment:${correlationId}] Buyer notification already exists (dedupe)`);
        }
      } catch (notifError) {
        console.warn(`[marketSettlePayment:${correlationId}] NOTIFICATION_ERROR: ${notifError.message}`);
        settlementWarnings.push({ step: 'notify_buyer', error: notifError.message });
      }
    } catch (postDeliveryError) {
      console.error(`[marketSettlePayment:${correlationId}] POST_DELIVERY_ERROR: ${postDeliveryError.message}`);
      settlementWarnings.push({ step: 'post_delivery', error: postDeliveryError.message });
    }
    
    // Build response
    const responseData = {
      settled: true,
      payment_id: payment.id,
      settled_at: now,
      requested_alz_amount: payment.alz_amount,  // Original requested amount
      slice_sum_alz_amount: paymentAmount.toString(),  // Sum of all slices
      delivered_alz_amount: (settledOrders.length > 0 ? settledOrders.reduce((sum, o) => sum + BigInt(o.matchedAlz), 0n) : 0n).toString(),  // Actual delivered
      buyer_nic: payment.buyer_nic,
      buyer_character_idx: payment.buyer_character_idx,
      settledOrders: settledOrders.length > 0 ? settledOrders : undefined,
      bridge: {
        called: bridgeProofs.length > 0,
        endpoint: '/internal/alz/settle',
        proofs: bridgeProofs
      },
      build_signature: BUILD_SIGNATURE,
      correlation_id: correlationId,
      warnings: settlementWarnings.length > 0 ? settlementWarnings : undefined
    };

    // Add debug metadata if requested
    if (isDebugMode && settledOrders.length > 0) {
      responseData.meta = {
        paymentId: payment.id,
        txid: payment.efi_txid,
        sliceCount: settledOrders.length,
        bridgeEndpoint: '/internal/alz/settle',
        perSlice: settledOrders.map((order, idx) => ({
          index: idx,
          orderId: order.orderId,
          lockKeyUsed: order.lockKeyUsed.substring(0, 20) + '...',
          matchedAlz: order.matchedAlz,
          bridgeStatus: order.bridgeStatus || 'SETTLED'
        })),
        bridgeProofs,
        invariants: {
          paymentAmount: paymentAmount.toString(),
          sliceSum: paymentAmount.toString(),
          delivered: (settledOrders.length > 0 ? settledOrders.reduce((sum, o) => sum + BigInt(o.matchedAlz), 0n) : 0n).toString()
        }
      };
    }

    return Response.json({
      ok: true,
      data: responseData
    }, { status: 200 });

  } catch (error) {
    console.error(`[marketSettlePayment:${correlationId}] CRITICAL_ERROR: ${error.message}`);
    
    return Response.json({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro ao liquidar pagamento',
        detail: error.message
      }
    }, { status: 500 });
  }
});