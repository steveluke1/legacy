import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { seller_user_id } = await req.json();

    if (!seller_user_id) {
      return Response.json({ error: 'seller_user_id required' }, { status: 400 });
    }

    const badges = [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

    // Get seller's orders from last 30 days
    const orders = await base44.asServiceRole.entities.MarketOrder.filter({
      'listing_snapshot.seller_user_id': seller_user_id
    });

    const recentOrders = orders.filter(o => new Date(o.created_date) >= thirtyDaysAgo);
    const completedOrders = recentOrders.filter(o => o.status === 'COMPLETED');

    // Elite Seller: 20+ sales in 30 days
    if (completedOrders.length >= 20) {
      badges.push('Elite Seller');
    }

    // Zero Disputes: no disputes in 30 days
    const disputes = await base44.asServiceRole.entities.MarketAuditLog.filter({
      action: 'DISPUTE_OPENED',
      metadata_json: { $regex: seller_user_id }
    });
    const recentDisputes = disputes.filter(d => new Date(d.created_date) >= thirtyDaysAgo);
    
    if (recentDisputes.length === 0 && completedOrders.length > 0) {
      badges.push('Zero Disputes');
    }

    // FastTrade: average delivery time < 2 hours (simulated for now)
    // TODO: Implement actual delivery time tracking
    if (completedOrders.length >= 10) {
      badges.push('FastTrade');
    }

    // Trusted Diamond: 4.8+ rating with 50+ sales
    const ratings = await base44.asServiceRole.entities.MarketReputation.filter({
      seller_user_id
    });
    
    if (ratings.length >= 50) {
      const avgScore = ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length;
      if (avgScore >= 4.8) {
        badges.push('Trusted Diamond');
      }
    }

    return Response.json({ success: true, badges });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});