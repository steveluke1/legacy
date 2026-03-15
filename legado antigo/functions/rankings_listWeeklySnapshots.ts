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
    
    // Get all snapshots, grouped by week_key
    const snapshots = await base44.asServiceRole.entities.WeeklyRankingSnapshot.list('-created_date', 100);
    
    // Group by week_key
    const weekMap = {};
    
    for (const snapshot of snapshots) {
      if (!weekMap[snapshot.week_key]) {
        weekMap[snapshot.week_key] = {
          week_key: snapshot.week_key,
          period_start: snapshot.period_start,
          period_end: snapshot.period_end,
          snapshots: []
        };
      }
      
      weekMap[snapshot.week_key].snapshots.push({
        type: snapshot.type,
        status: snapshot.status,
        generated_at: snapshot.generated_at,
        id: snapshot.id
      });
    }
    
    const weeks = Object.values(weekMap).sort((a, b) => 
      b.period_start.localeCompare(a.period_start)
    );
    
    return Response.json({ weeks });
    
  } catch (error) {
    console.error('[rankings_listWeeklySnapshots] Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});