// functions/alzGetMarketSummary.js
// Get ALZ market summary with liquidity and price stats (canonical camelCase)

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Buscar apenas ordens ativas (otimizado - limite 500)
    const activeOrders = await base44.asServiceRole.entities.AlzSellOrder.filter({
      status: 'active'
    }, undefined, 500);

    // Filtrar apenas com remaining_alz > 0
    const availableOrders = activeOrders.filter(order => order.remaining_alz > 0);

    // Calcular total de ALZ disponível
    const totalAlzAvailable = availableOrders.reduce((sum, order) => sum + order.remaining_alz, 0);

    // Ordenar por preço para encontrar melhor/pior
    const sortedByPrice = [...availableOrders].sort((a, b) => 
      a.price_per_billion_brl - b.price_per_billion_brl
    );

    const bestPricePerBillionBRL = sortedByPrice.length > 0 ? sortedByPrice[0].price_per_billion_brl : null;
    const worstPricePerBillionBRL = sortedByPrice.length > 0 ? sortedByPrice[sortedByPrice.length - 1].price_per_billion_brl : null;
    
    // Calcular preço médio ponderado
    let avgPricePerBillionBRL = null;
    if (totalAlzAvailable > 0) {
      const weightedSum = availableOrders.reduce((sum, order) => 
        sum + (order.remaining_alz * order.price_per_billion_brl), 0
      );
      avgPricePerBillionBRL = weightedSum / totalAlzAvailable;
    }

    // Buscar histórico REAL de trades executadas (últimos 365 dias)
    const dailyAggs = await base44.asServiceRole.entities.AlzTradeDailyAgg.list('-day_key', 365);
    
    // Construir série histórica (ordenado por data crescente)
    const history = dailyAggs
      .sort((a, b) => a.day_key.localeCompare(b.day_key))
      .map(agg => ({
        date: agg.day_key,
        avgPricePerBillionBRL: parseFloat(agg.vwap_price_per_billion_brl.toFixed(2)),
        volumeBillionAlz: parseFloat((agg.volume_alz / 1_000_000_000).toFixed(2))
      }));

    // Calcular volumes por período (7D, 30D, 365D)
    const now = new Date();
    const get7DaysAgo = () => {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d.toISOString().split('T')[0];
    };
    const get30DaysAgo = () => {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return d.toISOString().split('T')[0];
    };
    const get365DaysAgo = () => {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      return d.toISOString().split('T')[0];
    };

    const volume7D = dailyAggs
      .filter(agg => agg.day_key >= get7DaysAgo())
      .reduce((sum, agg) => sum + agg.volume_alz, 0);
    
    const volume30D = dailyAggs
      .filter(agg => agg.day_key >= get30DaysAgo())
      .reduce((sum, agg) => sum + agg.volume_alz, 0);
    
    const volume365D = dailyAggs
      .reduce((sum, agg) => sum + agg.volume_alz, 0);

    return Response.json({
      totalAlzAvailable,
      bestPricePerBillionBRL,
      worstPricePerBillionBRL,
      avgPricePerBillionBRL,
      history,
      volumeStats: {
        volume7dB: parseFloat((volume7D / 1_000_000_000).toFixed(2)),
        volume30dB: parseFloat((volume30D / 1_000_000_000).toFixed(2)),
        volume365dB: parseFloat((volume365D / 1_000_000_000).toFixed(2))
      }
    });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});