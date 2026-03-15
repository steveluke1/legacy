// functions/alzGetQuote.js
// Get quote for ALZ purchase (canonical camelCase)

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const { requestedAlzAmount } = await req.json();

    // Validação
    if (!requestedAlzAmount || requestedAlzAmount < 10_000_000 || requestedAlzAmount > 100_000_000_000) {
      return Response.json({
        error: 'A quantidade deve estar entre 10.000.000 e 100.000.000.000 ALZ.'
      }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Buscar todas as ordens ativas (limite 500)
    const activeOrders = await base44.asServiceRole.entities.AlzSellOrder.filter({
      status: 'active'
    }, undefined, 500);

    // Filtrar com remaining_alz > 0 e ordenar por preço (cheapest first)
    const availableOrders = (activeOrders || [])
      .filter(order => order.remaining_alz && order.remaining_alz > 0)
      .sort((a, b) => a.price_per_billion_brl - b.price_per_billion_brl);

    // Algoritmo de matching
    let remainingToMatch = requestedAlzAmount;
    let totalPriceBRL = 0;
    const ladder = [];
    const matchedOrders = [];

    for (const order of availableOrders) {
      if (remainingToMatch <= 0) break;

      const matchedAlz = Math.min(remainingToMatch, order.remaining_alz);
      const priceForThisSlice = (matchedAlz / 1_000_000_000) * order.price_per_billion_brl;

      totalPriceBRL += priceForThisSlice;
      remainingToMatch -= matchedAlz;

      matchedOrders.push({
        orderId: order.id,
        sellerUserId: order.seller_user_id,
        matchedAlz,
        pricePerBillionBRL: order.price_per_billion_brl,
        priceBRL: priceForThisSlice
      });

      // Adicionar ao ladder (agregar por preço)
      const existingLevel = ladder.find(l => l.pricePerBillionBRL === order.price_per_billion_brl);
      if (existingLevel) {
        existingLevel.matchedAlz += matchedAlz;
        existingLevel.sellerCount += 1;
      } else {
        ladder.push({
          pricePerBillionBRL: order.price_per_billion_brl,
          matchedAlz,
          sellerCount: 1
        });
      }
    }

    const availableAlzAmount = requestedAlzAmount - remainingToMatch;
    const isFullyAvailable = availableAlzAmount >= requestedAlzAmount;
    
    const averagePricePerBillionBRL = availableAlzAmount > 0 
      ? totalPriceBRL / (availableAlzAmount / 1_000_000_000)
      : null;

    return Response.json({
      requestedAlzAmount,
      availableAlzAmount,
      isFullyAvailable,
      totalPriceBRL,
      averagePricePerBillionBRL,
      ladder,
      _matchedOrders: matchedOrders, // Internal use for payment creation
      correlationId: `quote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });

  } catch (error) {
    console.error('alzGetQuote error:', error);
    return Response.json({ 
      error: error.message || 'Erro ao calcular cotação'
    }, { status: 500 });
  }
});