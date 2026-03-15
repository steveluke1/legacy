import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({
        success: false,
        error: 'Apenas administradores podem executar esta função.'
      }, { status: 403 });
    }

    const now = new Date();
    const startTime = new Date(now.getTime() - 30 * 60000); // Started 30 min ago

    // Create an IN_PROGRESS match
    const match = await base44.asServiceRole.entities.TGWarMatch.create({
      date: now.toISOString().split('T')[0],
      start_time: startTime.toISOString(),
      status: 'IN_PROGRESS',
      map_name: 'Tierra Gloriosa',
      capella_score: 12350,
      procyon_score: 10980,
      capella_kills: 145,
      procyon_kills: 132,
      total_players_capella: 67,
      total_players_procyon: 63
    });

    // Create some events
    const events = [
      {
        match_id: match.id,
        timestamp: new Date(startTime.getTime() + 5 * 60000).toISOString(),
        faction: 'CAPELLA',
        type: 'TOWER_DESTROYED',
        description: 'Capella destruiu a Torre Norte'
      },
      {
        match_id: match.id,
        timestamp: new Date(startTime.getTime() + 12 * 60000).toISOString(),
        faction: 'PROCYON',
        type: 'BASE_CAPTURED',
        description: 'Procyon capturou a Base Oeste'
      },
      {
        match_id: match.id,
        timestamp: new Date(startTime.getTime() + 18 * 60000).toISOString(),
        faction: 'CAPELLA',
        type: 'GUARDIAN_KILLED',
        description: 'Capella eliminou o Guardian de Procyon'
      },
      {
        match_id: match.id,
        timestamp: new Date(startTime.getTime() + 22 * 60000).toISOString(),
        faction: 'NEUTRAL',
        type: 'KILL_STREAK',
        description: 'DarkSlayer alcançou 50 kills consecutivos'
      },
      {
        match_id: match.id,
        timestamp: new Date(startTime.getTime() + 28 * 60000).toISOString(),
        faction: 'CAPELLA',
        type: 'BASE_CAPTURED',
        description: 'Capella capturou a Base Central'
      }
    ];

    for (const event of events) {
      await base44.asServiceRole.entities.TGWarEvent.create(event);
    }

    // Create top players
    const players = [
      { character_name: 'DarkSlayer', guild_name: 'Apocalypse', faction: 'CAPELLA', kills: 52, assists: 18, deaths: 7, score: 1340 },
      { character_name: 'ShadowKnight', guild_name: 'Royalty', faction: 'PROCYON', kills: 48, assists: 22, deaths: 9, score: 1280 },
      { character_name: 'IceQueen', guild_name: 'Apocalypse', faction: 'CAPELLA', kills: 41, assists: 31, deaths: 12, score: 1190 },
      { character_name: 'Thunderbolt', guild_name: 'Dominion', faction: 'PROCYON', kills: 39, assists: 27, deaths: 8, score: 1150 },
      { character_name: 'CrimsonBlade', guild_name: 'Warriors', faction: 'CAPELLA', kills: 37, assists: 19, deaths: 11, score: 1080 },
      { character_name: 'MysticArcher', guild_name: 'Royalty', faction: 'PROCYON', kills: 35, assists: 29, deaths: 13, score: 1050 },
      { character_name: 'DeathBringer', guild_name: 'Apocalypse', faction: 'CAPELLA', kills: 33, assists: 24, deaths: 10, score: 990 },
      { character_name: 'StormWizard', guild_name: 'Phoenix', faction: 'PROCYON', kills: 31, assists: 26, deaths: 14, score: 950 }
    ];

    for (const player of players) {
      await base44.asServiceRole.entities.TGWarPlayerScore.create({
        match_id: match.id,
        ...player
      });
    }

    return Response.json({
      success: true,
      message: 'Guerra demo criada com sucesso',
      match_id: match.id
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});