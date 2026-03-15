import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ 
        error: 'Apenas administradores podem popular dados demo' 
      }, { status: 403 });
    }

    // Limpar dados existentes
    const existingOrders = await base44.asServiceRole.entities.AlzSellOrder.filter({});
    for (const order of existingOrders) {
      await base44.asServiceRole.entities.AlzSellOrder.delete(order.id);
    }

    const existingTrades = await base44.asServiceRole.entities.AlzTrade.filter({});
    for (const trade of existingTrades) {
      await base44.asServiceRole.entities.AlzTrade.delete(trade.id);
    }

    // Criar 50 ofertas de venda (AlzSellOrder)
    // Total target: 476 bilhões (476_000_000_000)
    const sellOrders = [];
    const basePrice = 15.0; // R$ 15,00 por bilhão base
    const priceVariation = 8.0; // Variação de até R$ 8
    const targetTotal = 476_000_000_000;
    
    // Distribuir 476B entre 50 ofertas (média ~9.5B cada, com variação)
    let remainingAlz = targetTotal;

    for (let i = 0; i < 50; i++) {
      const priceOffset = (Math.random() - 0.5) * priceVariation * 2;
      const pricePerBillion = Math.max(8.0, basePrice + priceOffset);
      
      // Última oferta recebe o restante, outras entre 5B-15B
      let totalAlz;
      if (i === 49) {
        totalAlz = remainingAlz;
      } else {
        const avgRemaining = remainingAlz / (50 - i);
        const variation = avgRemaining * 0.5; // ±50% de variação
        totalAlz = Math.floor(avgRemaining + (Math.random() - 0.5) * variation);
        totalAlz = Math.max(3_000_000_000, totalAlz); // Mínimo 3B
        remainingAlz -= totalAlz;
      }
      
      const order = await base44.asServiceRole.entities.AlzSellOrder.create({
        seller_user_id: `demo_seller_${i}`,
        total_alz: totalAlz,
        remaining_alz: totalAlz,
        price_per_billion_brl: parseFloat(pricePerBillion.toFixed(2)),
        status: 'active'
      });
      
      sellOrders.push(order);
    }

    // Criar 40 trades históricos (últimos 30 dias)
    const trades = [];
    const now = new Date();
    
    for (let i = 0; i < 40; i++) {
      // Distribuir nos últimos 30 dias
      const daysAgo = Math.floor(Math.random() * 30);
      const tradeDate = new Date(now);
      tradeDate.setDate(tradeDate.getDate() - daysAgo);
      
      const priceOffset = (Math.random() - 0.5) * priceVariation * 2;
      const unitPrice = Math.max(8.0, basePrice + priceOffset);
      
      // Quantidade varia entre 1B e 10B
      const alzAmount = Math.floor(1_000_000_000 + Math.random() * 9_000_000_000);
      const totalPrice = (alzAmount / 1_000_000_000) * unitPrice;
      
      const trade = await base44.asServiceRole.entities.AlzTrade.create({
        buyer_user_id: `demo_buyer_${i}`,
        seller_user_id: `demo_seller_${i % 20}`,
        alz_amount: alzAmount,
        unit_price_per_billion_brl: parseFloat(unitPrice.toFixed(2)),
        total_price_brl: parseFloat(totalPrice.toFixed(2)),
        pix_payment_id: `demo_pix_${i}`
      });

      // Ajustar a data manualmente (workaround)
      await base44.asServiceRole.entities.AlzTrade.update(trade.id, {
        created_date: tradeDate.toISOString()
      });
      
      trades.push(trade);
    }

    // Calcular estatísticas
    const totalAlzAvailable = sellOrders.reduce((sum, o) => sum + o.remaining_alz, 0);
    const avgPrice = sellOrders.reduce((sum, o) => sum + o.price_per_billion_brl, 0) / sellOrders.length;
    const minPrice = Math.min(...sellOrders.map(o => o.price_per_billion_brl));
    const maxPrice = Math.max(...sellOrders.map(o => o.price_per_billion_brl));

    return Response.json({
      success: true,
      message: 'Dados demo criados com sucesso',
      statistics: {
        sellOrders: sellOrders.length,
        trades: trades.length,
        totalAlzAvailable: totalAlzAvailable,
        avgPricePerBillionBRL: parseFloat(avgPrice.toFixed(2)),
        minPricePerBillionBRL: parseFloat(minPrice.toFixed(2)),
        maxPricePerBillionBRL: parseFloat(maxPrice.toFixed(2))
      }
    });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});