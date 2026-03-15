// functions/alzCancelSellOrderV1.js
// Cancel sell order after 24h with ALZ unlock
// VERSION: V1 - Body token auth (HS256)

const BUILD_STAMP = "alzCancelSellOrderV1-v1-20260114";

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Manual JWT verification with HS256 (ported from auth_me.js)
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

    // ✅ SELF-TEST FIRST (before any auth/validation/SDK calls)
    if (body?.__selfTest === true) {
      return Response.json({
        ok: true,
        data: {
          self_test: true,
          message: 'alzCancelSellOrderV1 is operational',
          timestamp: new Date().toISOString(),
          build: BUILD_STAMP
        },
        _build: BUILD_STAMP
      }, { status: 200 });
    }

    // Extract fields
    const { token, sellOrderId } = body;

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

    if (!sellOrderId || typeof sellOrderId !== 'string') {
      return Response.json({
        ok: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'ID da oferta não fornecido.'
        },
        _build: BUILD_STAMP
      }, { status: 400 });
    }

    // Verify JWT
    const jwtSecret = Deno.env.get('JWT_SECRET');
    if (!jwtSecret) {
      console.error('[alzCancelSellOrderV1] JWT_SECRET missing');
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

    // Load AlzSellOrder
    let sellOrder;
    try {
      const orders = await base44.asServiceRole.entities.AlzSellOrder.filter({
        id: sellOrderId
      });
      
      if (!orders || orders.length === 0) {
        return Response.json({
          ok: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Oferta não encontrada.'
          },
          _build: BUILD_STAMP
        }, { status: 404 });
      }
      
      sellOrder = orders[0];
    } catch (e) {
      console.error('[alzCancelSellOrderV1] Error loading sell order:', e);
      return Response.json({
        ok: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Oferta não encontrada.'
        },
        _build: BUILD_STAMP
      }, { status: 404 });
    }

    // Validate ownership
    if (sellOrder.seller_user_id !== userId) {
      return Response.json({
        ok: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Você não tem permissão para cancelar esta oferta.'
        },
        _build: BUILD_STAMP
      }, { status: 403 });
    }

    // Check if already cancelled (idempotency)
    if (sellOrder.status === 'cancelled') {
      return Response.json({
        ok: true,
        data: {
          sellOrder,
          unlock: {
            amountUnlocked: 0,
            previousLocked: 0,
            newLocked: 0
          },
          message: 'Oferta já estava cancelada'
        },
        _build: BUILD_STAMP
      });
    }

    // Validate status is cancellable
    if (sellOrder.status === 'filled') {
      return Response.json({
        ok: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Não é possível cancelar uma oferta já vendida.'
        },
        _build: BUILD_STAMP
      }, { status: 400 });
    }

    if (!['active', 'partial'].includes(sellOrder.status)) {
      return Response.json({
        ok: false,
        error: {
          code: 'INVALID_STATUS',
          message: 'Não é possível cancelar esta oferta.'
        },
        _build: BUILD_STAMP
      }, { status: 400 });
    }

    // Enforce 24h rule
    const createdAt = new Date(sellOrder.created_date);
    const now = new Date();
    const millisSinceCreation = now - createdAt;
    const hoursSinceCreation = millisSinceCreation / (1000 * 60 * 60);

    if (hoursSinceCreation < 24) {
      const remainingMillis = (24 * 60 * 60 * 1000) - millisSinceCreation;
      const remainingSeconds = Math.ceil(remainingMillis / 1000);
      
      return Response.json({
        ok: false,
        error: {
          code: 'CANCEL_NOT_ALLOWED_YET',
          message: 'Você só pode cancelar após 24 horas da criação.',
          remainingSeconds
        },
        _build: BUILD_STAMP
      }, { status: 400 });
    }

    // Get amount to unlock
    const amountToUnlock = sellOrder.remaining_alz || 0;

    if (amountToUnlock <= 0) {
      // No ALZ to unlock, just update status
      const updatedOrder = await base44.asServiceRole.entities.AlzSellOrder.update(
        sellOrder.id,
        { status: 'cancelled' }
      );

      return Response.json({
        ok: true,
        data: {
          sellOrder: updatedOrder,
          unlock: {
            amountUnlocked: 0,
            previousLocked: 0,
            newLocked: 0
          },
          message: 'Oferta cancelada com sucesso!'
        },
        _build: BUILD_STAMP
      });
    }

    // Find GameAccount
    let gameAccount;
    if (sellOrder.seller_account_id) {
      // Try to load by seller_account_id first
      try {
        const accounts = await base44.asServiceRole.entities.GameAccount.filter({
          id: sellOrder.seller_account_id
        });
        if (accounts && accounts.length > 0) {
          gameAccount = accounts[0];
        }
      } catch (e) {
        console.error('[alzCancelSellOrderV1] Error loading GameAccount by id:', e);
      }
    }

    // Fallback: load by user_id
    if (!gameAccount) {
      const accounts = await base44.asServiceRole.entities.GameAccount.filter({
        user_id: userId
      });
      
      if (!accounts || accounts.length === 0) {
        return Response.json({
          ok: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Conta in-game não encontrada.'
          },
          _build: BUILD_STAMP
        }, { status: 404 });
      }
      
      gameAccount = accounts[0];
    }

    // Unlock ALZ
    const previousLocked = gameAccount.alz_locked || 0;
    const newLocked = Math.max(0, previousLocked - amountToUnlock);

    await base44.asServiceRole.entities.GameAccount.update(gameAccount.id, {
      alz_locked: newLocked
    });

    // Update sell order status
    const updatedOrder = await base44.asServiceRole.entities.AlzSellOrder.update(
      sellOrder.id,
      { status: 'cancelled' }
    );

    console.log(`[alzCancelSellOrderV1] Cancelled order ${sellOrder.id}, unlocked ${amountToUnlock} ALZ`);

    return Response.json({
      ok: true,
      data: {
        sellOrder: updatedOrder,
        unlock: {
          amountUnlocked: amountToUnlock,
          previousLocked,
          newLocked
        },
        message: 'Oferta cancelada com sucesso!'
      },
      _build: BUILD_STAMP
    });

  } catch (error) {
    console.error('[alzCancelSellOrderV1] ERROR:', error);
    return Response.json({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Não foi possível cancelar a oferta. Tente novamente.',
        detail: String(error.message || error)
      },
      _build: BUILD_STAMP
    }, { status: 500 });
  }
});