// functions/marketGetPriceHistory.js
// Fetch aggregated price history from MarketTrade + AlzTradeDailyAgg
// BUILD: market-price-history-v1-20260115

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BUILD_STAMP = "market-price-history-v1-20260115";

function getDayRangeForPeriod(days) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);
  
  const startKey = start.toISOString().split('T')[0];
  const endKey = now.toISOString().split('T')[0];
  
  return { startKey, endKey, days };
}

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const { range, __selfTest } = body;
    
    // SELF-TEST
    if (__selfTest === true) {
      const base44 = createClientFromRequest(req);
      const sampleCount = await base44.asServiceRole.entities.MarketTrade.filter({}, undefined, 1);
      return Response.json({
        ok: true,
        data: {
          canQueryTrades: true,
          sampleCount: sampleCount.length
        },
        _build: BUILD_STAMP
      }, { status: 200 });
    }
    
    // Validate range
    const validRanges = { '7D': 7, '30D': 30, '1A': 365 };
    const periodDays = validRanges[range] || 30;
    
    const { startKey, endKey } = getDayRangeForPeriod(periodDays);
    
    const base44 = createClientFromRequest(req);
    
    // Query MarketTrade records in time range
    const trades = await base44.asServiceRole.entities.MarketTrade.filter({
      day_key: { $gte: startKey, $lte: endKey }
    }, 'day_key', 1000);
    
    // Aggregate by day_key
    const aggregated = {};
    
    trades.forEach(trade => {
      const key = trade.day_key;
      if (!aggregated[key]) {
        aggregated[key] = {
          day: key,
          volumeAlz: 0n,
          totalBRL: 0,
          minPrice: Number.MAX_SAFE_INTEGER,
          maxPrice: 0,
          tradeCount: 0,
          weightedPrice: 0
        };
      }
      
      const alz = BigInt(trade.alz_amount || 0);
      const price = trade.price_per_billion_brl || 0;
      const brl = trade.total_brl || 0;
      
      aggregated[key].volumeAlz += alz;
      aggregated[key].totalBRL += brl;
      aggregated[key].minPrice = Math.min(aggregated[key].minPrice, price);
      aggregated[key].maxPrice = Math.max(aggregated[key].maxPrice, price);
      aggregated[key].tradeCount += 1;
      aggregated[key].weightedPrice += brl; // Weighted numerator
    });
    
    // Convert to points array with VWAP
    const points = Object.keys(aggregated).sort().map(key => {
      const agg = aggregated[key];
      const volumeBillions = Number(agg.volumeAlz) / 1_000_000_000;
      const vwap = volumeBillions > 0 ? agg.weightedPrice / volumeBillions : 0;
      
      return {
        ts: key,
        date: key,
        avgPricePer1bBrl: vwap,
        minPricePer1bBrl: agg.minPrice === Number.MAX_SAFE_INTEGER ? 0 : agg.minPrice,
        maxPricePer1bBrl: agg.maxPrice,
        volumeAlz: Number(agg.volumeAlz),
        volumeBillions: volumeBillions,
        totalBrl: agg.totalBRL,
        tradeCount: agg.tradeCount
      };
    });
    
    return Response.json({
      ok: true,
      data: {
        range,
        periodDays,
        points,
        pointsCount: points.length,
        totalVolume: Number(trades.reduce((sum, t) => sum + BigInt(t.alz_amount || 0), 0n)),
        totalTrades: trades.length
      },
      _build: BUILD_STAMP
    }, { status: 200 });
    
  } catch (error) {
    console.error('[marketGetPriceHistory] ERROR:', error);
    return Response.json({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro ao buscar histórico de preço',
        detail: error.message
      },
      _build: BUILD_STAMP
    }, { status: 500 });
  }
});