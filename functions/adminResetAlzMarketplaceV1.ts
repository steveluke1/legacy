// functions/adminResetAlzMarketplaceV1.js
// Admin-only function to reset ALZ marketplace (delete all offers/trades, recompute alz_locked)
// BUILD: adminResetAlzMarketplaceV1-v1-20260114

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BUILD_STAMP = "adminResetAlzMarketplaceV1-v1-20260114";

// JWT verification with HS256 (self-contained)
async function verifyJwtHs256(token, secret) {
  const encoder = new TextEncoder();
  
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('INVALID_TOKEN_FORMAT');
  }
  
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  
  const payloadJson = atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/'));
  const payload = JSON.parse(payloadJson);
  
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    throw new Error('TOKEN_EXPIRED');
  }
  
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

// Paginated delete helper (avoid timeouts)
async function deletePaginated(base44, entityName, batchSize = 100) {
  let totalDeleted = 0;
  let hasMore = true;
  
  while (hasMore) {
    const records = await base44.asServiceRole.entities[entityName].list(undefined, batchSize);
    
    if (records.length === 0) {
      hasMore = false;
      break;
    }
    
    for (const record of records) {
      await base44.asServiceRole.entities[entityName].delete(record.id);
      totalDeleted++;
    }
    
    // If we got less than batchSize, we're done
    if (records.length < batchSize) {
      hasMore = false;
    }
  }
  
  return totalDeleted;
}

Deno.serve(async (req) => {
  try {
    const data = await req.json().catch(() => ({}));
    
    // Self-test
    if (data?.__selfTest === true) {
      return Response.json({
        ok: true,
        data: { self_test: true },
        _build: BUILD_STAMP
      }, { status: 200 });
    }

    const token = String(data?.token || "").trim();
    const confirm = String(data?.confirm || "").trim();
    const dryRun = data?.dryRun !== false; // default true
    
    if (!token) {
      return Response.json({ 
        ok: false, 
        error: { code: 'UNAUTHORIZED', message: 'Token de admin obrigatório' },
        _build: BUILD_STAMP
      }, { status: 401 });
    }

    // Verify admin JWT
    const adminJwtSecret = Deno.env.get('ADMIN_JWT_SECRET');
    if (!adminJwtSecret) {
      return Response.json({
        ok: false,
        error: { code: 'SERVER_CONFIG_ERROR', message: 'Erro de configuração do servidor' },
        _build: BUILD_STAMP
      }, { status: 500 });
    }

    let payload;
    try {
      payload = await verifyJwtHs256(token, adminJwtSecret);
    } catch (e) {
      return Response.json({
        ok: false,
        error: { code: 'UNAUTHORIZED', message: 'Token inválido ou expirado' },
        _build: BUILD_STAMP
      }, { status: 401 });
    }

    // Check admin role
    if (payload.role !== 'admin') {
      return Response.json({
        ok: false,
        error: { code: 'FORBIDDEN', message: 'Apenas admins podem executar esta operação' },
        _build: BUILD_STAMP
      }, { status: 403 });
    }

    // Verify confirmation code
    if (confirm !== 'RESET_ALZ_MARKETPLACE') {
      return Response.json({
        ok: false,
        error: { 
          code: 'INVALID_CONFIRM', 
          message: 'Código de confirmação inválido. Use: "RESET_ALZ_MARKETPLACE"' 
        },
        _build: BUILD_STAMP
      }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    
    // Count records BEFORE deletion (for reporting)
    const sellOrdersCount = (await base44.asServiceRole.entities.AlzSellOrder.list(undefined, 1000)).length;
    const pixPaymentsCount = (await base44.asServiceRole.entities.MarketPixPayment.list(undefined, 1000)).length;
    const tradesCount = (await base44.asServiceRole.entities.AlzTradeDailyAgg.list(undefined, 1000)).length;

    if (dryRun) {
      return Response.json({
        ok: true,
        data: {
          dryRun: true,
          deleted: {
            sellOffers: sellOrdersCount,
            buyOffers: pixPaymentsCount,
            trades: tradesCount
          },
          impactedAccounts: 0,
          recomputedLocked: [],
          message: 'Dry run - nenhum dado foi deletado. Use dryRun=false para executar.'
        },
        _build: BUILD_STAMP
      });
    }

    // ACTUAL DELETION (paginated to avoid timeouts)
    console.log('[adminResetAlzMarketplaceV1] Starting marketplace reset...');
    
    const deletedSellOffers = await deletePaginated(base44, 'AlzSellOrder', 50);
    const deletedBuyOffers = await deletePaginated(base44, 'MarketPixPayment', 50);
    const deletedTrades = await deletePaginated(base44, 'AlzTradeDailyAgg', 50);

    console.log('[adminResetAlzMarketplaceV1] Deleted:', {
      sellOffers: deletedSellOffers,
      buyOffers: deletedBuyOffers,
      trades: deletedTrades
    });

    // Recompute alz_locked for all GameAccounts
    // Since we deleted ALL sell orders, all alz_locked should be 0
    const allGameAccounts = await base44.asServiceRole.entities.GameAccount.list(undefined, 500);
    
    const recomputedLocked = [];
    let impactedCount = 0;
    
    for (const account of allGameAccounts) {
      if (account.alz_locked && account.alz_locked !== 0) {
        const previousLocked = account.alz_locked;
        
        await base44.asServiceRole.entities.GameAccount.update(account.id, {
          alz_locked: 0
        });
        
        recomputedLocked.push({
          account_id: account.id,
          previousLocked,
          newLocked: 0
        });
        
        impactedCount++;
      }
    }

    console.log('[adminResetAlzMarketplaceV1] Reset complete. Impacted accounts:', impactedCount);

    return Response.json({
      ok: true,
      data: {
        dryRun: false,
        deleted: {
          sellOffers: deletedSellOffers,
          buyOffers: deletedBuyOffers,
          trades: deletedTrades
        },
        impactedAccounts: impactedCount,
        recomputedLocked
      },
      _build: BUILD_STAMP
    });

  } catch (error) {
    console.error('[adminResetAlzMarketplaceV1] ERROR:', error);
    return Response.json({
      ok: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erro ao executar reset', detail: error.message },
      _build: BUILD_STAMP
    }, { status: 500 });
  }
});