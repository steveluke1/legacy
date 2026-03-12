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
    
    const { week_key } = await req.json();
    
    if (!week_key) {
      return Response.json({ 
        error: 'week_key is required' 
      }, { status: 400 });
    }
    
    // Get snapshots
    const snapshots = await base44.asServiceRole.entities.WeeklyRankingSnapshot.filter({
      week_key
    });
    
    // Get payouts
    const payouts = await base44.asServiceRole.entities.WeeklyRankingPayout.filter({
      week_key
    });
    
    // Calculate totals
    const corredoresPayouts = payouts.filter(p => p.ranking_type === 'CORREDORES');
    const matadorPayouts = payouts.filter(p => p.ranking_type === 'MATADOR');
    
    const totalBRL = corredoresPayouts.reduce((sum, p) => sum + p.amount, 0);
    const totalCASH = matadorPayouts.reduce((sum, p) => sum + p.amount, 0);
    
    const paidBRL = corredoresPayouts
      .filter(p => p.payout_status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const paidCASH = matadorPayouts
      .filter(p => p.payout_status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    
    return Response.json({
      week_key,
      snapshots,
      payouts,
      totals: {
        total_brl: totalBRL,
        total_cash: totalCASH,
        paid_brl: paidBRL,
        paid_cash: paidCASH,
        pending_brl: totalBRL - paidBRL,
        pending_cash: totalCASH - paidCASH
      }
    });
    
  } catch (error) {
    console.error('[rankings_adminGetWeekDetail] Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});