import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ 
        error: 'Unauthorized' 
      }, { status: 401 });
    }
    
    const { payout_id, status, audit_note } = await req.json();
    
    if (!payout_id || !status) {
      return Response.json({ 
        error: 'payout_id and status are required' 
      }, { status: 400 });
    }
    
    if (!['paid', 'void'].includes(status)) {
      return Response.json({ 
        error: 'status must be "paid" or "void"' 
      }, { status: 400 });
    }
    
    // Get payout
    const payouts = await base44.asServiceRole.entities.WeeklyRankingPayout.filter({
      id: payout_id
    });
    
    if (payouts.length === 0) {
      return Response.json({ 
        error: 'Payout not found' 
      }, { status: 404 });
    }
    
    const payout = payouts[0];
    
    // Update payout
    const updateData = {
      payout_status: status,
      audit_note: audit_note || null
    };
    
    if (status === 'paid') {
      updateData.paid_at = new Date().toISOString();
      updateData.paid_by_admin_id = user.id;
    }
    
    const updatedPayout = await base44.asServiceRole.entities.WeeklyRankingPayout.update(
      payout_id,
      updateData
    );
    
    // Check all payouts for this week and update snapshot status
    const allPayouts = await base44.asServiceRole.entities.WeeklyRankingPayout.filter({
      week_key: payout.week_key,
      snapshot_id: payout.snapshot_id
    });
    
    const paidCount = allPayouts.filter(p => p.payout_status === 'paid').length;
    const totalCount = allPayouts.length;
    
    let snapshotStatus;
    if (paidCount === 0) {
      snapshotStatus = 'closed';
    } else if (paidCount === totalCount) {
      snapshotStatus = 'paid_done';
    } else {
      snapshotStatus = 'paid_partial';
    }
    
    // Update snapshot status
    await base44.asServiceRole.entities.WeeklyRankingSnapshot.update(
      payout.snapshot_id,
      { status: snapshotStatus }
    );
    
    return Response.json({
      success: true,
      payout: updatedPayout,
      snapshot_status: snapshotStatus
    });
    
  } catch (error) {
    console.error('[rankings_adminSetPayoutStatus] Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});