import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { order_id, seller_user_id, score, comment } = await req.json();

    // Validate score
    if (!score || score < 1 || score > 5) {
      return Response.json({ error: 'Score must be between 1 and 5' }, { status: 400 });
    }

    // Check if already rated
    const existing = await base44.asServiceRole.entities.MarketReputation.filter({
      order_id,
      buyer_user_id: user.id
    });

    if (existing.length > 0) {
      return Response.json({ error: 'Order already rated' }, { status: 400 });
    }

    // Create reputation entry
    await base44.asServiceRole.entities.MarketReputation.create({
      order_id,
      seller_user_id,
      buyer_user_id: user.id,
      score,
      comment: comment || null,
      context: 'overall'
    });

    // Log action
    await base44.asServiceRole.entities.MarketAuditLog.create({
      action: 'ORDER_RATED',
      user_id: user.id,
      username: user.full_name || user.email,
      order_id,
      metadata_json: JSON.stringify({ score, seller_user_id })
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});