// functions/alzCreateSellOrderV2.js
// Create ALZ sell order with custom JWT body token auth
// VERSION: V2 - CANONICAL - Body token auth (HS256)

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BUILD_STAMP = 'alzCreateSellOrderV2-v8-bridge-safe-20260115';

// ═══════════════════════════════════════════════════════════════════════════
// INLINE BRIDGE CLIENT (safe, self-contained, no imports)
// ═══════════════════════════════════════════════════════════════════════════
async function callBridgeJson(url, payload, headers, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const httpStatus = response.status;
    const contentType = response.headers.get('content-type') || '';
    
    // Read response text first
    const responseText = await response.text();
    
    // Check if content-type is JSON
    if (!contentType.includes('application/json')) {
      const snippet = responseText.substring(0, 200);
      return {
        ok: false,
        error: {
          code: httpStatus === 404 ? 'BRIDGE_ENDPOINT_NOT_FOUND' : 'BRIDGE_BAD_RESPONSE',
          message: httpStatus === 404 
            ? 'Endpoint do Bridge não encontrado (404). Verifique a rota configurada.'
            : 'Resposta inválida do Bridge. Verifique se o endpoint existe e retorna JSON.',
          httpStatus,
          contentType,
          snippet
        }
      };
    }
    
    // Parse JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      const snippet = responseText.substring(0, 200);
      return {
        ok: false,
        error: {
          code: 'BRIDGE_INVALID_JSON',
          message: 'Resposta do Bridge não é JSON válido.',
          httpStatus,
          contentType,
          snippet
        }
      };
    }
    
    // Return parsed data
    return { ok: true, data, httpStatus };
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      return {
        ok: false,
        error: {
          code: 'BRIDGE_TIMEOUT',
          message: 'Tempo esgotado ao chamar o Bridge. Verifique se o Bridge está online.',
          timeoutMs
        }
      };
    }
    
    return {
      ok: false,
      error: {
        code: 'BRIDGE_NETWORK_ERROR',
        message: 'Erro de rede ao chamar o Bridge. Verifique a conectividade.',
        detail: error.message
      }
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// INLINE AUTH HELPER (no imports, self-contained)
// ═══════════════════════════════════════════════════════════════════════════
async function resolveCallerFromToken(base44, token, correlationId) {
  if (!token || typeof token !== 'string' || token.trim() === '') {
    return {
      ok: false,
      status: 401,
      error: {
        code: 'AUTH_TOKEN_MISSING',
        message: 'Sessão expirada. Faça login novamente.',
        stage_last: 'TOKEN_MISSING'
      }
    };
  }

  let authRes;
  try {
    authRes = await base44.functions.invoke('auth_me', { token });
  } catch (invokeError) {
    // auth_me invoke failed (network/deployment issue, NOT token validation)
    console.error(`[resolveCallerFromToken:${correlationId}] auth_me invoke exception: ${invokeError.message}`);
    return {
      ok: false,
      status: 503,
      error: {
        code: 'AUTH_SERVICE_UNAVAILABLE',
        message: 'Serviço de autenticação temporariamente indisponível. Tente novamente.',
        stage_last: 'AUTH_ME_INVOKE_EXCEPTION'
      }
    };
  }
  
  if (!authRes.data?.success || !authRes.data?.user) {
    console.warn(`[resolveCallerFromToken:${correlationId}] auth_me failed: ${JSON.stringify(authRes.data).substring(0, 100)}`);
    return {
      ok: false,
      status: 401,
      error: {
        code: 'AUTH_TOKEN_INVALID',
        message: 'Sessão inválida. Faça login novamente.',
        stage_last: 'AUTH_ME_FAILED'
      }
    };
  }
    
    const user = authRes.data.user;
    
    if (!user.game_user_num || typeof user.game_user_num !== 'number') {
      console.warn(`[resolveCallerFromToken:${correlationId}] Missing game_user_num: userId=${user.id}`);
      return {
        ok: false,
        status: 400,
        error: {
          code: 'USER_GAME_USER_NUM_MISSING',
          message: 'Sua conta ainda não está vinculada ao jogo. Entre em contato com o suporte.',
          stage_last: 'NO_GAME_USER_NUM'
        }
      };
    }
    
    return {
      ok: true,
      userId: user.id,
      gameUserNum: user.game_user_num,
      email: user.email,
      loginId: user.login_id,
      role: user.role || 'user'
    };
}

// Test mode flag: bypasses Split eligibility checks (use ONLY in dev/testing)
const testMode = Deno.env.get('MARKETPLACE_TEST_MODE') === '1';

// Extract auth token from Authorization header (preferred) or body.token (fallback)
function extractAuthToken(req, body) {
  // Try Authorization header first (standard)
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (authHeader) {
    const trimmed = authHeader.trim();
    if (trimmed.startsWith('Bearer ')) {
      const token = trimmed.slice(7).trim();
      if (token.length > 0) {
        return token;
      }
    }
  }
  
  // Fallback to body.token (legacy)
  if (body?.token && typeof body.token === 'string' && body.token.trim().length > 0) {
    return body.token.trim();
  }
  
  return null;
}



Deno.serve(async (req) => {
  const correlationId = `sell-order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  let stageLast = 'START';
  console.log(`[alzCreateSellOrderV2:${correlationId}] STAGE=START`);
  
  try {
    // Parse body safely
    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error(`[alzCreateSellOrderV2:${correlationId}] JSON_PARSE_ERROR`);
      return Response.json({
        ok: false,
        error: {
          code: 'INVALID_JSON',
          message: 'Requisição inválida'
        },
        _build: BUILD_STAMP,
        correlation_id: correlationId
      }, { status: 400 });
    }

    // Self-test removed: all requests must be authenticated

    // Extract fields
    const { totalAlz, pricePerBillionBRL } = body;

    // Auth: Extract token from Authorization header (preferred) or body (fallback)
    const rawToken = extractAuthToken(req, body);
    stageLast = 'TOKEN_EXTRACTED';
    
    console.log(`[alzCreateSellOrderV2:${correlationId}] STAGE=TOKEN_EXTRACTED hasToken=${!!rawToken}`);
    
    // STRICT: reject null, undefined, empty string
    if (!rawToken) {
      console.warn(`[alzCreateSellOrderV2:${correlationId}] AUTH_TOKEN_MISSING (extractAuthToken returned null)`);
      return Response.json({
        ok: false,
        error: {
          code: 'AUTH_TOKEN_MISSING',
          message: 'Sessão expirada. Faça login novamente.',
          stage_last: stageLast
        },
        _build: BUILD_STAMP,
        correlation_id: correlationId
      }, { status: 401 });
    }
    
    const token = rawToken;

    // STEP 1: Resolve caller identity from token (replaces JWT inline)
    const base44 = createClientFromRequest(req);
    const caller = await resolveCallerFromToken(base44, token, correlationId);
    
    if (!caller.ok) {
      console.warn(`[alzCreateSellOrderV2:${correlationId}] AUTH_FAILED: ${caller.error.code}`);
      return Response.json({
        ok: false,
        error: caller.error,
        _build: BUILD_STAMP,
        correlation_id: correlationId
      }, { status: caller.status });
    }
    
    const userId = caller.userId;
    const gameUserNum = caller.gameUserNum;
    
    stageLast = 'USER_LINKAGE_OK';
    console.log(`[alzCreateSellOrderV2:${correlationId}] STAGE=USER_LINKAGE_OK userId=${userId} gameUserNum=${gameUserNum}`);

    // ═══════════════════════════════════════════════════════════════════════
    // EFÍ SPLIT ELIGIBILITY CHECK (PRODUCTION SAFETY)
    // ═══════════════════════════════════════════════════════════════════════
    
    if (!testMode) {
      // Production mode: enforce Split verification
      const sellerProfiles = await base44.asServiceRole.entities.SellerProfile.filter({
        user_id: userId
      });
      
      const sellerProfile = sellerProfiles[0];
      
      if (!sellerProfile || sellerProfile.efi_split_status !== 'verified') {
        console.log(`[alzCreateSellOrderV2:${correlationId}] Split not verified: userId=${userId} hasProfile=${!!sellerProfile} status=${sellerProfile?.efi_split_status || 'missing'}`);
        
        return Response.json({
          ok: false,
          error: {
            code: 'SPLIT_NOT_CONFIGURED',
            message: 'Configure seus dados Efí Split antes de vender ALZ'
          },
          _build: BUILD_STAMP,
          correlation_id: correlationId
        }, { status: 400 });
      }
      
      console.log(`[alzCreateSellOrderV2:${correlationId}] Split verified: userId=${userId} status=${sellerProfile.efi_split_status}`);
    } else {
      console.log(`[alzCreateSellOrderV2:${correlationId}] TEST MODE: Split check bypassed`);
    }

    // Validações de negócio (strict type checking)
    if (typeof totalAlz !== 'number' || !Number.isFinite(totalAlz) || totalAlz < 10_000_000 || totalAlz > 100_000_000_000) {
      console.warn(`[alzCreateSellOrderV2:${correlationId}] INVALID_ALZ_AMOUNT totalAlz=${totalAlz} type=${typeof totalAlz}`);
      return Response.json({
        ok: false,
        error: {
          code: 'INVALID_ALZ_AMOUNT',
          message: 'A quantidade de ALZ deve estar entre 10.000.000 e 100.000.000.000.'
        },
        _build: BUILD_STAMP,
        correlation_id: correlationId
      }, { status: 400 });
    }

    if (typeof pricePerBillionBRL !== 'number' || !Number.isFinite(pricePerBillionBRL) || pricePerBillionBRL <= 0) {
      console.warn(`[alzCreateSellOrderV2:${correlationId}] INVALID_PRICE price=${pricePerBillionBRL} type=${typeof pricePerBillionBRL}`);
      return Response.json({
        ok: false,
        error: {
          code: 'INVALID_PRICE',
          message: 'O preço por bilhão deve ser maior que zero.'
        },
        _build: BUILD_STAMP,
        correlation_id: correlationId
      }, { status: 400 });
    }

    // Buscar informações do mercado para sugestões (fail-soft)
    let marketSummary = null;
    try {
      const summaryRes = await base44.functions.invoke('alzGetMarketSummary', {});
      marketSummary = summaryRes?.data || null;
    } catch (summaryError) {
      console.warn(`[alzCreateSellOrderV2:${correlationId}] Market summary fetch failed (non-critical):`, summaryError.message);
      // Continue without market suggestions (non-critical)
    }

    // Get or create GameAccount (for tracking alz_locked ledger)
    let gameAccount;
    const gameAccounts = await base44.asServiceRole.entities.GameAccount.filter({
      user_id: userId
    });

    if (gameAccounts.length === 0) {
      console.log(`[alzCreateSellOrderV2:${correlationId}] Creating GameAccount for userId=${userId}`);
      gameAccount = await base44.asServiceRole.entities.GameAccount.create({
        user_id: userId,
        username: caller.loginId || caller.email,
        email: caller.email,
        alz_balance: 0,  // Unused (warehouse is source-of-truth via Bridge)
        alz_locked: 0,
        cash_balance: 0,
        cash_locked: 0,
        is_active: true,
        is_test_account: false
      });
    } else {
      gameAccount = gameAccounts[0];
    }

    // ═══════════════════════════════════════════════════════════════════════
    // BRIDGE LOCK VALIDATION (SOURCE-OF-TRUTH FOR WAREHOUSE BALANCE)
    // ═══════════════════════════════════════════════════════════════════════
    
    const lockIdempotencyKey = `lock:${userId}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
    const escrowUserNumRaw = Deno.env.get('ESCROW_USERNUM') || '6';
    const escrowUserNum = parseInt(escrowUserNumRaw, 10);
    
    // Validate escrow config
    if (!Number.isFinite(escrowUserNum) || escrowUserNum <= 0) {
      console.error(`[alzCreateSellOrderV2:${correlationId}] ESCROW_CONFIG_INVALID escrowUserNum=${escrowUserNumRaw}`);
      return Response.json({
        ok: false,
        error: {
          code: 'BRIDGE_CONFIG_MISSING',
          message: 'Falha interna de configuração. Contate o suporte.',
          detail: 'ESCROW_USERNUM inválido'
        },
        _build: BUILD_STAMP,
        correlation_id: correlationId
      }, { status: 500 });
    }
    
    stageLast = 'CALL_BRIDGE_ALZ_LOCK';
    console.log(`[alzCreateSellOrderV2:${correlationId}] STAGE=CALL_BRIDGE_ALZ_LOCK userId=${userId} gameUserNum=${gameUserNum} totalAlz=${totalAlz} escrow=${escrowUserNum}`);

    let lockRes;
    try {
      lockRes = await base44.functions.invoke('bridgeAlzLock', {
        sellerUserNum: gameUserNum,
        amount: totalAlz.toString(),
        idempotencyKey: lockIdempotencyKey,
        escrowUserNum
      });
    } catch (lockInvokeError) {
      console.error(`[alzCreateSellOrderV2:${correlationId}] BRIDGE_ALZ_LOCK_INVOKE_FAILED:`, lockInvokeError.message);
      return Response.json({
        ok: false,
        error: {
          code: 'BRIDGE_ALZ_LOCK_FAILED',
          message: 'Falha ao comunicar com o servidor do jogo. Tente novamente.',
          detail: lockInvokeError.message,
          stage_last: stageLast
        },
        _build: BUILD_STAMP,
        correlation_id: correlationId
      }, { status: 424 }); // Failed Dependency
    }

    // Validate lockRes shape
    if (!lockRes || typeof lockRes !== 'object' || !lockRes.data) {
      console.error(`[alzCreateSellOrderV2:${correlationId}] BRIDGE_ALZ_LOCK_BAD_RESPONSE: missing data field`);
      return Response.json({
        ok: false,
        error: {
          code: 'BRIDGE_ALZ_LOCK_BAD_RESPONSE',
          message: 'Resposta inválida do servidor do jogo. Tente novamente.'
        },
        _build: BUILD_STAMP,
        correlation_id: correlationId
      }, { status: 424 });
    }

    if (!lockRes.data?.ok) {
      const errorCode = lockRes.data?.error?.code || 'BRIDGE_LOCK_FAILED';
      
      // Map Bridge errors to user-friendly PT-BR messages
      let userMessage;
      if (errorCode === 'INSUFFICIENT_WAREHOUSE_ALZ') {
        userMessage = 'ALZ insuficiente no warehouse do jogo. Verifique seu saldo in-game e tente novamente.';
      } else if (errorCode === 'BRIDGE_TIMEOUT') {
        userMessage = 'Tempo esgotado ao validar saldo. Tente novamente em alguns segundos.';
      } else if (errorCode === 'BRIDGE_NOT_CONFIGURED') {
        userMessage = 'Sistema de escrow indisponível. Contate o suporte.';
      } else if (errorCode === 'BRIDGE_NETWORK_ERROR') {
        userMessage = 'Erro de conectividade com servidor do jogo. Tente novamente.';
      } else {
        userMessage = lockRes.data?.error?.message || 'Erro ao bloquear ALZ no servidor do jogo';
      }
      
      console.error(`[alzCreateSellOrderV2:${correlationId}] Bridge lock failed:`, {
        errorCode,
        errorMsg: lockRes.data?.error?.message,
        userId,
        gameUserNum,
        totalAlz
      });
      
      return Response.json({
        ok: false,
        error: {
          code: errorCode,
          message: userMessage,
          detail: lockRes.data?.error
        },
        _build: BUILD_STAMP,
        correlation_id: correlationId
      }, { status: 400 });
    }
    
    stageLast = 'BRIDGE_ALZ_LOCK_OK';
    console.log(`[alzCreateSellOrderV2:${correlationId}] STAGE=BRIDGE_ALZ_LOCK_OK lockKey=${lockIdempotencyKey}`);

    // ═══════════════════════════════════════════════════════════════════════
    // CREATE SELL ORDER + MIRROR LOCK IN LOCAL LEDGER
    // ═══════════════════════════════════════════════════════════════════════
    
    let sellOrder;
    let compensationNeeded = false;
    
    try {
      // Update local ledger (mirrors Bridge escrow lock)
      await base44.asServiceRole.entities.GameAccount.update(gameAccount.id, {
        alz_locked: (gameAccount.alz_locked || 0) + totalAlz
      });
      
      // Create sell order with lock idempotency key
      sellOrder = await base44.asServiceRole.entities.AlzSellOrder.create({
        seller_user_id: userId,
        seller_account_id: gameAccount.id,
        total_alz: totalAlz,
        remaining_alz: totalAlz,
        price_per_billion_brl: pricePerBillionBRL,
        status: 'active',
        lock_idempotency_key: lockIdempotencyKey
      });
      
      stageLast = 'ENTITY_WRITE_OK';
      console.log(`[alzCreateSellOrderV2:${correlationId}] STAGE=ENTITY_WRITE_OK orderId=${sellOrder.id}`);
      
    } catch (createError) {
      console.error(`[alzCreateSellOrderV2:${correlationId}] Order creation failed after Bridge lock:`, createError.message);
      compensationNeeded = true;
      
      // Best-effort compensation: release Bridge lock
      try {
        const releaseRes = await base44.functions.invoke('bridgeAlzRelease', {
          idempotencyKey: lockIdempotencyKey
        });
        
        if (releaseRes.data?.ok) {
          console.log(`[alzCreateSellOrderV2:${correlationId}] Bridge lock released (compensation): lockKey=${lockIdempotencyKey}`);
        } else {
          console.error(`[alzCreateSellOrderV2:${correlationId}] Bridge release compensation failed:`, releaseRes.data?.error?.code);
        }
      } catch (releaseError) {
        console.error(`[alzCreateSellOrderV2:${correlationId}] Release compensation exception:`, releaseError.message);
      }
      
      // Return original creation error
      throw createError;
    }

    // Criar log de auditoria
    await base44.asServiceRole.entities.MarketAuditLog.create({
      action: 'LISTING_CREATED',
      user_id: userId,
      username: caller.email || caller.loginId || userId,
      listing_id: sellOrder.id,
      metadata_json: JSON.stringify({
        type: 'alz_sell_order',
        total_alz: totalAlz,
        price_per_billion_brl: pricePerBillionBRL,
        bridge_lock_key: lockIdempotencyKey
      })
    });

    // Track ALZ trade in analytics (SELL listing created)
    await base44.asServiceRole.entities.AnalyticsEvent.create({
      event_type: 'alz_trade',
      event_name: 'ALZ_SELL',
      path: '/mercado/alz/vender',
      role_context: 'user',
      user_id: userId,
      session_id: `trade_${sellOrder.id}`,
      anon_id: `user_${userId}`,
      day_key: new Date().toISOString().split('T')[0],
      dedupe_key: `alz_sell_${sellOrder.id}`,
      metadata: {
        order_id: sellOrder.id,
        trade_type: 'SELL',
        alz_amount: totalAlz,
        price_per_billion_brl: pricePerBillionBRL
      }
    });

    console.log(`[alzCreateSellOrderV2:${correlationId}] SUCCESS orderId=${sellOrder.id}`);
    
    return Response.json({
      ok: true,
      data: {
        sellOrder,
        marketSuggestions: marketSummary ? {
          bestPricePerBillionBRL: marketSummary.bestPricePerBillionBRL || null,
          avgPricePerBillionBRL: marketSummary.avgPricePerBillionBRL || null
        } : null
      },
      correlation_id: correlationId,
      _build: BUILD_STAMP
    });

  } catch (error) {
    console.error(`[alzCreateSellOrderV2:${correlationId}] UNEXPECTED_ERROR stage=${stageLast}:`, error.message);
    console.error(`[alzCreateSellOrderV2:${correlationId}] Stack:`, error.stack);
    
    // Audit log crítico (best-effort)
    try {
      const base44 = createClientFromRequest(req);
      await base44.asServiceRole.entities.MarketAuditLog.create({
        action: 'LISTING_CREATION_FAILED',
        user_id: 'unknown',
        username: 'unknown',
        metadata_json: JSON.stringify({
          error: error.message,
          stage: stageLast,
          correlation_id: correlationId
        })
      });
    } catch (auditError) {
      console.error(`[alzCreateSellOrderV2:${correlationId}] AUDIT_LOG_FAILED: ${auditError.message}`);
    }
    
    return Response.json({
      ok: false,
      error: {
        code: 'UNEXPECTED_INTERNAL_ERROR',
        message: 'Falha interna inesperada. Tente novamente.',
        detail: String(error.message || error),
        stage_last: stageLast
      },
      correlation_id: correlationId,
      _build: BUILD_STAMP
    }, { status: 500 });
  }
});