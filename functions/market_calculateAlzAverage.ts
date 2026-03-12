import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get ALZ transactions from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const allOrders = await base44.asServiceRole.entities.MarketOrder.filter(
      { status: 'COMPLETED' },
      '-completed_at',
      500
    );

    // Filter for ALZ listings only from last 7 days
    const alzOrders = [];
    for (const order of allOrders) {
      if (!order.listing_snapshot || !order.completed_at) continue;
      
      const completedDate = new Date(order.completed_at);
      if (completedDate < sevenDaysAgo) continue;
      
      const listing = order.listing_snapshot;
      if (listing.type === 'ALZ' && listing.alz_amount && order.total_price_brl) {
        alzOrders.push({
          alz_amount: listing.alz_amount,
          price_brl: order.total_price_brl,
          completed_at: order.completed_at
        });
      }
    }

    if (alzOrders.length === 0) {
      return Response.json({
        success: true,
        average_brl_per_100m: null,
        sample_size: 0,
        calculated_at: new Date().toISOString(),
        message: 'Sem transações ALZ nos últimos 7 dias'
      });
    }

    // Normalize to 100M ALZ base
    const normalizedPrices = alzOrders.map(order => {
      const ratio = 100000000 / order.alz_amount;
      return order.price_brl * ratio;
    });

    const average = normalizedPrices.reduce((sum, price) => sum + price, 0) / normalizedPrices.length;

    return Response.json({
      success: true,
      average_brl_per_100m: Math.round(average * 100) / 100,
      sample_size: alzOrders.length,
      calculated_at: new Date().toISOString()
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});