// functions/alzCreateSellOrder.js
// Create ALZ sell order with custom JWT body token auth
// VERSION: 3.0.0 - Body token auth (HS256) - COMPLETE REBUILD

const BUILD_STAMP = "alzCreateSellOrder-v3-complete-rebuild-20260113";

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Manual JWT verification with HS256
async function verifyJwtHs256(token, secret) {
  const encoder = new TextEncoder();
  
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('INVALID_TOKEN_FORMAT');
  }
  
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  
  // Decode payload
  const payloadJson = atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/'));
  const payload = JSON.parse(payloadJson);
  
  // Verify expiration
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error('TOKEN_EXPIRED');
  }
  
  // Verify signature
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  
  const signatureBytes = Uint8Array.from(
    atob(encodedSignature.replace(/-/g, '+').replace(/_/g, '/')),
    c => c.charCodeAt(0)
  );
  
  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    signatureBytes,
    encoder.encode(`${encodedHeader}.${encodedPayload}`)
  );
  
  if (!isValid) {
    throw new Error('INVALID_SIGNATURE');
  }
  
  return payload;
}

Deno.serve(async (req) => {
  try {
    // Parse body safely
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return Response.json({
        ok: false,
        error: {
          code: 'INVALID_JSON',
          message: 'Requisição inválida'
        },
        _build: BUILD_STAMP
      }, { status: 400 });
    }

    // SELF-TEST FIRST (before any auth/validation)
    if (body?.__selfTest === true) {
      return Response.json({
        ok: true,
        data: {
          self_test: true,
          message: 'alzCreateSellOrder is operational',
          timestamp: new Date().toISOString(),
          build: BUILD_STAMP
        },
        _build: BUILD_STAMP
      }, { status: 200 });
    }

    // Extract fields
    const { token, totalAlz, pricePerBillionBRL } = body;

    // Auth: Extract and verify token
    if (!token || typeof token !== 'string') {
      return Response.json({
        ok: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Sessão expirada. Faça login novamente.'
        },
        _build: BUILD_STAMP
      }, { status: 401 });
    }

    // Verify JWT
    const jwtSecret = Deno.env.get('JWT_SECRET');
    if (!jwtSecret) {
      console.error('[alzCreateSellOrder] JWT_SECRET missing');
      return Response.json({
        ok: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Erro de configuração do servidor'
        },
        _build: BUILD_STAMP
      }, { status: 500 });
    }

    let payload;
    try {
      payload = await verifyJwtHs256(token, jwtSecret);
    } catch (e) {
      const errorMsg = e.message === 'TOKEN_EXPIRED' 
        ? 'Sessão expirada. Faça login novamente.'
        : 'Sessão inválida. Faça login novamente.';
      
      return Response.json({
        ok: false,
        error: {
          code: 'UNAUTHORIZED',
          message: errorMsg
        },
        _build: BUILD_STAMP
      }, { status: 401 });
    }

    // Validate required claims
    if (!payload.sub) {
      return Response.json({
        ok: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Sessão inválida. Faça login novamente.'
        },
        _build: BUILD_STAMP
      }, { status: 401 });
    }

    const userId = payload.sub;
    const base44 = createClientFromRequest(req);

    // Validações de negócio
    if (!totalAlz || totalAlz < 10_000_000 || totalAlz > 100_000_000_000) {
      return Response.json({
        ok: false,
        error: {
          code: 'INVALID_ALZ_AMOUNT',
          message: 'A quantidade de ALZ deve estar entre 10.000.000 e 100.000.000.000.'
        },
        _build: BUILD_STAMP
      }, { status: 400 });
    }

    if (!pricePerBillionBRL || pricePerBillionBRL <= 0) {
      return Response.json({
        ok: false,
        error: {
          code: 'INVALID_PRICE',
          message: 'O preço por bilhão deve ser maior que zero.'
        },
        _build: BUILD_STAMP
      }, { status: 400 });
    }

    // Buscar informações do mercado para sugestões
    const summaryRes = await base44.functions.invoke('alzGetMarketSummary', {});
    const marketSummary = summaryRes.data;

    // Get seller's game account
    const gameAccounts = await base44.asServiceRole.entities.GameAccount.filter({
      user_id: userId
    });

    if (gameAccounts.length === 0) {
      return Response.json({
        ok: false,
        error: {
          code: 'GAME_ACCOUNT_NOT_FOUND',
          message: 'Conta in-game não encontrada.'
        },
        _build: BUILD_STAMP
      }, { status: 404 });
    }

    const gameAccount = gameAccounts[0];
    const availableAlz = (gameAccount.alz_balance || 0) - (gameAccount.alz_locked || 0);

    if (availableAlz < totalAlz) {
      return Response.json({
        ok: false,
        error: {
          code: 'INSUFFICIENT_ALZ',
          message: `ALZ insuficiente. Disponível: ${availableAlz.toLocaleString()} ALZ`
        },
        _build: BUILD_STAMP
      }, { status: 400 });
    }

    // Lock ALZ atomically
    await base44.asServiceRole.entities.GameAccount.update(gameAccount.id, {
      alz_locked: (gameAccount.alz_locked || 0) + totalAlz
    });

    // Criar ordem
    const sellOrder = await base44.asServiceRole.entities.AlzSellOrder.create({
      seller_user_id: userId,
      seller_account_id: gameAccount.id,
      total_alz: totalAlz,
      remaining_alz: totalAlz,
      price_per_billion_brl: pricePerBillionBRL,
      status: 'active'
    });

    // Criar log de auditoria
    await base44.asServiceRole.entities.MarketAuditLog.create({
      action: 'LISTING_CREATED',
      user_id: userId,
      username: payload.email || userId,
      listing_id: sellOrder.id,
      metadata_json: JSON.stringify({
        type: 'alz_sell_order',
        total_alz: totalAlz,
        price_per_billion_brl: pricePerBillionBRL
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

    return Response.json({
      ok: true,
      data: {
        sellOrder,
        marketSuggestions: {
          bestPricePerBillionBRL: marketSummary.bestPricePerBillionBRL,
          avgPricePerBillionBRL: marketSummary.avgPricePerBillionBRL
        },
        correlationId: `alz_sell_${sellOrder.id}`
      },
      _build: BUILD_STAMP
    });

  } catch (error) {
    console.error('[alzCreateSellOrder] ERROR:', error);
    return Response.json({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Não foi possível criar a oferta agora. Tente novamente.',
        detail: String(error.message || error)
      },
      _build: BUILD_STAMP
    }, { status: 500 });
  }
});