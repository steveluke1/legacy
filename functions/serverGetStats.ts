import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get latest REAL server stats only
    const allStats = await base44.asServiceRole.entities.ServerStats.list('-created_date', 10);
    
    // Filter to only real data from game server
    const realStats = allStats.filter(stat => 
      stat.is_real === true || stat.source === 'GAME_SERVER'
    );
    
    // If no real stats exist, return unavailable
    if (!realStats || realStats.length === 0) {
      return Response.json({
        success: true,
        data: {
          available: false,
          server_status: 'online',
          online_players: 0,
          active_guilds: 0,
          tg_battles_last_24h: 0,
          total_registered: 0
        }
      });
    }
    
    const data = realStats[0];
    
    // Return only public fields
    return Response.json({
      success: true,
      data: {
        available: true,
        server_status: data.server_status || 'online',
        online_players: data.online_players || 0,
        active_guilds: data.active_guilds || 0,
        tg_battles_last_24h: data.tg_battles_last_24h || 0,
        total_registered: data.total_registered || 0
      }
    });
    
  } catch (error) {
    console.error('[serverGetStats] Error:', error);
    
    // Return unavailable on error (no fake data)
    return Response.json({
      success: true,
      data: {
        available: false,
        server_status: 'online',
        online_players: 0,
        active_guilds: 0,
        tg_battles_last_24h: 0,
        total_registered: 0
      }
    });
  }
});