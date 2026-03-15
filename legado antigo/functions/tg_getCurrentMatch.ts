import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Try to find IN_PROGRESS match
    const inProgressMatches = await base44.asServiceRole.entities.TGWarMatch.filter({
      status: 'IN_PROGRESS'
    }, '-start_time', 1);

    let currentMatch = null;

    if (inProgressMatches.length > 0) {
      currentMatch = inProgressMatches[0];
    } else {
      // Get last finished match
      const finishedMatches = await base44.asServiceRole.entities.TGWarMatch.filter({
        status: 'FINISHED'
      }, '-end_time', 1);

      if (finishedMatches.length > 0) {
        currentMatch = finishedMatches[0];
      }
    }

    if (!currentMatch) {
      return Response.json({
        success: true,
        match: null,
        events: [],
        top_players: [],
        message: 'Nenhuma guerra encontrada.'
      });
    }

    // Get events for this match
    const events = await base44.asServiceRole.entities.TGWarEvent.filter({
      match_id: currentMatch.id
    }, '-timestamp', 20);

    // Get top players
    const topPlayers = await base44.asServiceRole.entities.TGWarPlayerScore.filter({
      match_id: currentMatch.id
    }, '-score', 10);

    // Aggregate kills and player counts
    const allPlayers = await base44.asServiceRole.entities.TGWarPlayerScore.filter({
      match_id: currentMatch.id
    });

    const capellaPlayers = allPlayers.filter(p => p.faction === 'CAPELLA');
    const procyonPlayers = allPlayers.filter(p => p.faction === 'PROCYON');

    const capellaKills = capellaPlayers.reduce((sum, p) => sum + (p.kills || 0), 0);
    const procyonKills = procyonPlayers.reduce((sum, p) => sum + (p.kills || 0), 0);

    // Update match with aggregated data
    const updatedMatch = {
      ...currentMatch,
      capella_kills: capellaKills,
      procyon_kills: procyonKills,
      total_players_capella: capellaPlayers.length,
      total_players_procyon: procyonPlayers.length
    };

    return Response.json({
      success: true,
      match: updatedMatch,
      events,
      top_players: topPlayers
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});