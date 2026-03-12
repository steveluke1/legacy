import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { week_key, type } = await req.json();
    
    if (!week_key || !type) {
      return Response.json({ 
        error: 'week_key and type are required' 
      }, { status: 400 });
    }
    
    const snapshots = await base44.entities.WeeklyRankingSnapshot.filter({
      week_key,
      type
    });
    
    if (snapshots.length === 0) {
      return Response.json({ snapshot: null });
    }
    
    return Response.json({ 
      snapshot: snapshots[0] 
    });
    
  } catch (error) {
    console.error('[rankings_getWeeklySnapshot] Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});