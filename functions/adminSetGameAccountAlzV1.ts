// functions/adminSetGameAccountAlzV1.js
// Admin-only function to set/add ALZ balance on GameAccount
// VERSION: V1 - Self-contained (no local imports)

const BUILD_STAMP = "adminSetGameAccountAlzV1-v1-20260113";

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

// Safe number parsing
function safeNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  throw new Error('INVALID_NUMBER');
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

    // ✅ SELF-TEST FIRST (before any auth/validation)
    if (body?.__selfTest === true) {
      return Response.json({
        ok: true,
        data: {
          self_test: true,
          message: 'adminSetGameAccountAlzV1 is operational',
          timestamp: new Date().toISOString(),
          build: BUILD_STAMP
        },
        _build: BUILD_STAMP
      }, { status: 200 });
    }

    // Extract fields
    const { token, userId, mode = 'set', amountAlz, resetLocked = false, createIfMissing = true } = body;

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
      console.error('[adminSetGameAccountAlzV1] JWT_SECRET missing');
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

    // Validate required claims and admin role
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

    if (payload.role !== 'admin') {
      console.warn(`[adminSetGameAccountAlzV1] Non-admin access attempt: ${payload.sub}`);
      return Response.json({
        ok: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Acesso negado.'
        },
        _build: BUILD_STAMP
      }, { status: 403 });
    }

    // Validate amountAlz
    if (amountAlz === undefined || amountAlz === null) {
      return Response.json({
        ok: false,
        error: {
          code: 'MISSING_AMOUNT',
          message: 'Campo amountAlz é obrigatório'
        },
        _build: BUILD_STAMP
      }, { status: 400 });
    }

    let alzAmount;
    try {
      alzAmount = safeNumber(amountAlz);
      if (alzAmount < 0) {
        throw new Error('NEGATIVE_AMOUNT');
      }
    } catch (e) {
      return Response.json({
        ok: false,
        error: {
          code: 'INVALID_AMOUNT',
          message: 'amountAlz deve ser um número >= 0'
        },
        _build: BUILD_STAMP
      }, { status: 400 });
    }

    // Validate mode
    if (mode !== 'set' && mode !== 'add') {
      return Response.json({
        ok: false,
        error: {
          code: 'INVALID_MODE',
          message: 'mode deve ser "set" ou "add"'
        },
        _build: BUILD_STAMP
      }, { status: 400 });
    }

    const targetUserId = userId || payload.sub;
    console.log(`[adminSetGameAccountAlzV1] Admin: ${payload.sub}, target: ${targetUserId}, mode: ${mode}, amount: ${alzAmount}, resetLocked: ${resetLocked}`);

    const base44 = createClientFromRequest(req);

    // Fetch GameAccount
    const gameAccounts = await base44.asServiceRole.entities.GameAccount.filter({
      user_id: targetUserId
    }, undefined, 1);

    let gameAccount = null;

    if (gameAccounts.length > 0) {
      gameAccount = gameAccounts[0];
    } else if (createIfMissing) {
      // Create minimal GameAccount
      gameAccount = await base44.asServiceRole.entities.GameAccount.create({
        user_id: targetUserId,
        username: payload.login_id || `user-${targetUserId.substring(0, 8)}`,
        email: payload.email || null,
        alz_balance: 0,
        alz_locked: 0,
        cash_balance: 0,
        cash_locked: 0,
        is_active: true,
        is_test_account: false
      });
      console.log(`[adminSetGameAccountAlzV1] Created GameAccount: ${gameAccount.id}`);
    } else {
      return Response.json({
        ok: false,
        error: {
          code: 'NOT_FOUND',
          message: 'GameAccount não encontrado'
        },
        _build: BUILD_STAMP
      }, { status: 404 });
    }

    // Calculate new balance
    const currentBalance = gameAccount.alz_balance || 0;
    let newBalance;

    if (mode === 'set') {
      newBalance = alzAmount;
    } else { // mode === 'add'
      newBalance = currentBalance + alzAmount;
    }

    // Never allow negative balance
    if (newBalance < 0) {
      return Response.json({
        ok: false,
        error: {
          code: 'NEGATIVE_BALANCE',
          message: 'Operação resultaria em saldo negativo'
        },
        _build: BUILD_STAMP
      }, { status: 400 });
    }

    // Update GameAccount
    const updateData = {
      alz_balance: newBalance
    };

    if (resetLocked) {
      updateData.alz_locked = 0;
    }

    await base44.asServiceRole.entities.GameAccount.update(gameAccount.id, updateData);

    // Fetch updated record
    const updatedAccounts = await base44.asServiceRole.entities.GameAccount.filter({
      user_id: targetUserId
    }, undefined, 1);

    const updatedAccount = updatedAccounts[0];

    console.log(`[adminSetGameAccountAlzV1] Updated GameAccount ${gameAccount.id}: alz_balance ${currentBalance} -> ${newBalance}`);

    return Response.json({
      ok: true,
      data: {
        gameAccount: {
          id: updatedAccount.id,
          user_id: updatedAccount.user_id,
          username: updatedAccount.username,
          email: updatedAccount.email || null,
          alz_balance: updatedAccount.alz_balance || 0,
          alz_locked: updatedAccount.alz_locked || 0,
          cash_balance: updatedAccount.cash_balance || 0,
          cash_locked: updatedAccount.cash_locked || 0,
          is_active: updatedAccount.is_active !== false,
          is_test_account: updatedAccount.is_test_account === true
        },
        operation: {
          mode,
          amountAlz: alzAmount,
          previousBalance: currentBalance,
          newBalance: updatedAccount.alz_balance || 0,
          resetLocked
        }
      },
      _build: BUILD_STAMP
    });

  } catch (error) {
    console.error('[adminSetGameAccountAlzV1] ERROR:', error);
    return Response.json({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Não foi possível atualizar a conta agora. Tente novamente.',
        detail: String(error.message || error)
      },
      _build: BUILD_STAMP
    }, { status: 500 });
  }
});