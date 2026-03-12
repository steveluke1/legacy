// functions/adminBackfillAllGameAccountsV1.js
// Admin-only batch backfill to create missing GameAccount records
// VERSION: V1 - Self-contained (no local imports)

const BUILD_STAMP = "adminBackfillAllGameAccountsV1-v1-20260113";

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { createClient } from 'npm:@supabase/supabase-js@2';

// Manual JWT verification with HS256 (copied from auth_me.js)
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

// Supabase admin singleton
let _supabase = null;
function getSupabaseAdmin() {
  if (_supabase) return _supabase;
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Missing Supabase secrets');
  _supabase = createClient(url, key, { auth: { persistSession: false } });
  return _supabase;
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
          message: 'adminBackfillAllGameAccountsV1 is operational',
          supportedModes: ['userIds', 'scanAll'],
          timestamp: new Date().toISOString(),
          build: BUILD_STAMP
        },
        _build: BUILD_STAMP
      }, { status: 200 });
    }

    // Extract fields
    const { token, dryRun = true, userIds, scanAll = false, batchSize = 200, offsetStart = 0 } = body;

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
      console.error('[adminBackfillAllGameAccountsV1] JWT_SECRET missing');
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
      console.warn(`[adminBackfillAllGameAccountsV1] Non-admin access attempt: ${payload.sub}`);
      return Response.json({
        ok: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Acesso negado.'
        },
        _build: BUILD_STAMP
      }, { status: 403 });
    }

    console.log(`[adminBackfillAllGameAccountsV1] Admin user: ${payload.sub}, dryRun: ${dryRun}, mode: ${scanAll ? 'scanAll' : 'userIds'}`);

    const base44 = createClientFromRequest(req);
    const supabase = getSupabaseAdmin();

    // Validate batchSize
    const safeBatchSize = Math.min(Math.max(1, batchSize || 200), 500);

    let targetUserIds = [];
    let usersData = [];

    // MODE A: userIds explicit list
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      console.log(`[adminBackfillAllGameAccountsV1] userIds mode: ${userIds.length} users`);
      targetUserIds = userIds;

      // Fetch user data from Supabase for username mapping
      const { data: users, error: fetchError } = await supabase
        .from('auth_users')
        .select('user_id, login_id, username, email')
        .in('user_id', targetUserIds);

      if (fetchError) {
        console.error(`[adminBackfillAllGameAccountsV1] Supabase query error: ${fetchError.message}`);
        throw new Error('Failed to fetch user data');
      }

      usersData = users || [];

    } 
    // MODE B: scanAll pagination
    else if (scanAll === true) {
      console.log(`[adminBackfillAllGameAccountsV1] scanAll mode: offset ${offsetStart}, batch ${safeBatchSize}`);

      const { data: users, error: scanError } = await supabase
        .from('auth_users')
        .select('user_id, login_id, username, email')
        .range(offsetStart, offsetStart + safeBatchSize - 1)
        .order('created_date', { ascending: true });

      if (scanError) {
        console.error(`[adminBackfillAllGameAccountsV1] Supabase scan error: ${scanError.message}`);
        throw new Error('Failed to scan users');
      }

      usersData = users || [];
      targetUserIds = usersData.map(u => u.user_id);

    } else {
      return Response.json({
        ok: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Você deve fornecer userIds ou ativar scanAll.'
        },
        _build: BUILD_STAMP
      }, { status: 400 });
    }

    // Build username lookup map
    const usernameMap = {};
    usersData.forEach(u => {
      usernameMap[u.user_id] = u.login_id || u.username || u.email || `user-${u.user_id.substring(0, 8)}`;
    });

    // Process each user
    let scanned = 0;
    let existed = 0;
    let created = 0;
    let errors = 0;
    const sampleCreatedIds = [];

    for (const userId of targetUserIds) {
      scanned++;

      try {
        // Check if GameAccount exists
        const existingAccounts = await base44.asServiceRole.entities.GameAccount.filter({
          user_id: userId
        }, undefined, 1);

        if (existingAccounts.length > 0) {
          existed++;
          continue;
        }

        // Create GameAccount
        if (!dryRun) {
          const newAccount = await base44.asServiceRole.entities.GameAccount.create({
            user_id: userId,
            username: usernameMap[userId] || `user-${userId.substring(0, 8)}`,
            email: usersData.find(u => u.user_id === userId)?.email || null,
            alz_balance: 0,
            alz_locked: 0,
            cash_balance: 0,
            cash_locked: 0,
            is_active: true,
            is_test_account: false
          });

          if (sampleCreatedIds.length < 50) {
            sampleCreatedIds.push(newAccount.id);
          }
        }

        created++;

      } catch (err) {
        console.error(`[adminBackfillAllGameAccountsV1] Error processing ${userId}: ${err.message}`);
        errors++;
      }
    }

    // Determine if there are more records to process
    const hasMore = scanAll && usersData.length === safeBatchSize;
    const nextOffset = hasMore ? offsetStart + safeBatchSize : null;

    console.log(`[adminBackfillAllGameAccountsV1] Complete: scanned=${scanned}, existed=${existed}, created=${created}, errors=${errors}, hasMore=${hasMore}`);

    return Response.json({
      ok: true,
      data: {
        scanned,
        existed,
        created,
        errors,
        sampleCreatedIds,
        dryRun,
        hasMore,
        nextOffset
      },
      _build: BUILD_STAMP
    });

  } catch (error) {
    console.error('[adminBackfillAllGameAccountsV1] ERROR:', error);
    return Response.json({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Não foi possível executar o backfill agora. Tente novamente.',
        detail: String(error.message || error)
      },
      _build: BUILD_STAMP
    }, { status: 500 });
  }
});