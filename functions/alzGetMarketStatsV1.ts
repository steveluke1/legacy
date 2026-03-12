// functions/alzGetMarketStatsV1.js
// Get REAL marketplace stats with NO placeholders (canonical camelCase)
// BUILD: alzGetMarketStatsV1-v1-20260114

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BUILD_STAMP = "alzGetMarketStatsV1-v1-20260114";

// JWT verification with HS256 (self-contained, optional for stats)
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
    const base44 = createClientFromRequest(req);

    // Fetch REAL active sell orders
    const activeOrders = await base44.asServiceRole.entities.AlzSellOrder.filter({
      status: 'active'
    }, undefined, 500);

    const availableOrders = activeOrders.filter(order => order.remaining_alz > 0);

    // Compute min price (REAL data only)
    let minPricePerBillionBRL = null;
    if (availableOrders.length > 0) {
      const sortedByPrice = [...availableOrders].sort((a, b) => 
        a.price_per_billion_brl - b.price_per_billion_brl
      );
      minPricePerBillionBRL = sortedByPrice[0].price_per_billion_brl;
    }

    // Compute avg price from REAL recent trades (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoKey = thirtyDaysAgo.toISOString().split('T')[0];

    const recentTrades = await base44.asServiceRole.entities.AlzTradeDailyAgg.filter({
      day_key: { $gte: thirtyDaysAgoKey }
    }, '-day_key', 30);

    let avgRecentPricePerBillionBRL = null;
    let recentTradesCount = 0;

    if (recentTrades.length > 0) {
      const totalVolume = recentTrades.reduce((sum, agg) => sum + agg.volume_alz, 0);
      const totalWeightedPrice = recentTrades.reduce((sum, agg) => sum + agg.total_weighted_price, 0);
      recentTradesCount = recentTrades.reduce((sum, agg) => sum + agg.trades_count, 0);

      if (totalVolume > 0) {
        avgRecentPricePerBillionBRL = totalWeightedPrice / totalVolume;
      }
    }

    const marketStats = {
      minPricePerBillionBRL,
      avgRecentPricePerBillionBRL,
      activeSellCount: availableOrders.length,
      recentTradesCount
    };

    // Optional: Include user balances if token provided
    let userStats = undefined;

    if (token) {
      const jwtSecret = Deno.env.get('JWT_SECRET');
      if (jwtSecret) {
        try {
          const payload = await verifyJwtHs256(token, jwtSecret);
          
          if (payload.sub) {
            // Fetch user's GameAccount
            const gameAccounts = await base44.asServiceRole.entities.GameAccount.filter({
              user_id: payload.sub
            }, undefined, 1);

            if (gameAccounts.length > 0) {
              const account = gameAccounts[0];
              userStats = {
                alz_balance: account.alz_balance || 0,
                alz_locked: account.alz_locked || 0,
                alz_available: (account.alz_balance || 0) - (account.alz_locked || 0)
              };
            }
          }
        } catch (e) {
          // Token invalid/expired - ignore, return only market stats
          console.warn('[alzGetMarketStatsV1] Token verification failed:', e.message);
        }
      }
    }

    const response = {
      ok: true,
      data: {
        market: marketStats
      },
      _build: BUILD_STAMP
    };

    if (userStats !== undefined) {
      response.data.user = userStats;
    }

    return Response.json(response);

  } catch (error) {
    console.error('[alzGetMarketStatsV1] ERROR:', error);
    return Response.json({
      ok: false,
      error: { code: 'INTERNAL_ERROR', message: 'Erro ao buscar estatísticas', detail: error.message },
      _build: BUILD_STAMP
    }, { status: 500 });
  }
});