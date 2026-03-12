// functions/adminGetGameAccountV1.js
// Admin-only function to get (and optionally create) GameAccount records
// VERSION: V1 - Self-contained (no local imports)

const BUILD_STAMP = "adminGetGameAccountV1-v1-20260113";

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

    // ✅ SELF-TEST FIRST (before any auth/validation)
    if (body?.__selfTest === true) {
      return Response.json({
        ok: true,
        data: {
          self_test: true,
          message: 'adminGetGameAccountV1 is operational',
          timestamp: new Date().toISOString(),
          build: BUILD_STAMP
        },
        _build: BUILD_STAMP
      }, { status: 200 });
    }

    // Extract fields
    const { token, userId, createIfMissing = false } = body;

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
      console.error('[adminGetGameAccountV1] JWT_SECRET missing');
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
      console.warn(`[adminGetGameAccountV1] Non-admin access attempt: ${payload.sub}`);
      return Response.json({
        ok: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Acesso negado.'
        },
        _build: BUILD_STAMP
      }, { status: 403 });
    }

    const targetUserId = userId || payload.sub;
    console.log(`[adminGetGameAccountV1] Admin user: ${payload.sub}, target: ${targetUserId}, createIfMissing: ${createIfMissing}`);

    const base44 = createClientFromRequest(req);

    // Fetch GameAccount
    const gameAccounts = await base44.asServiceRole.entities.GameAccount.filter({
      user_id: targetUserId
    }, undefined, 1);

    let found = false;
    let created = false;
    let gameAccount = null;

    if (gameAccounts.length > 0) {
      found = true;
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
      found = true;
      created = true;
      console.log(`[adminGetGameAccountV1] Created GameAccount: ${gameAccount.id}`);
    } else {
      console.log(`[adminGetGameAccountV1] GameAccount not found for user ${targetUserId}`);
    }

    if (!found) {
      return Response.json({
        ok: false,
        error: {
          code: 'NOT_FOUND',
          message: 'GameAccount não encontrado'
        },
        _build: BUILD_STAMP
      }, { status: 404 });
    }

    return Response.json({
      ok: true,
      data: {
        found,
        created,
        gameAccount: gameAccount ? {
          id: gameAccount.id,
          user_id: gameAccount.user_id,
          username: gameAccount.username,
          email: gameAccount.email || null,
          alz_balance: gameAccount.alz_balance || 0,
          alz_locked: gameAccount.alz_locked || 0,
          cash_balance: gameAccount.cash_balance || 0,
          cash_locked: gameAccount.cash_locked || 0,
          is_active: gameAccount.is_active !== false,
          is_test_account: gameAccount.is_test_account === true
        } : null
      },
      _build: BUILD_STAMP
    });

  } catch (error) {
    console.error('[adminGetGameAccountV1] ERROR:', error);
    return Response.json({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Não foi possível buscar a conta agora. Tente novamente.',
        detail: String(error.message || error)
      },
      _build: BUILD_STAMP
    }, { status: 500 });
  }
});