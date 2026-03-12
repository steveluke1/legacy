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

    // Check if there's already an IN_PROGRESS match
    const existing = await base44.asServiceRole.entities.TGWarMatch.filter({
      status: 'IN_PROGRESS'
    });

    if (existing.length > 0) {
      return Response.json({
        success: true,
        message: 'Já existe uma guerra em andamento',
        match: existing[0]
      });
    }

    // Create a new IN_PROGRESS match
    const now = new Date();
    const match = await base44.asServiceRole.entities.TGWarMatch.create({
      date: now.toISOString().split('T')[0],
      start_time: now.toISOString(),
      status: 'IN_PROGRESS',
      map_name: 'Tierra Gloriosa',
      capella_score: 8750,
      procyon_score: 6420,
      capella_kills: 342,
      procyon_kills: 289,
      total_players_capella: 48,
      total_players_procyon: 52
    });

    // Create player scores
    const capellaPlayers = [
      { character_name: 'DarkKnight', guild_name: 'Legends', kills: 47, deaths: 12, assists: 23, score: 2850 },
      { character_name: 'ThunderGod', guild_name: 'Legends', kills: 38, deaths: 18, assists: 19, score: 2420 },
      { character_name: 'FireStorm', guild_name: 'Inferno', kills: 29, deaths: 14, assists: 15, score: 1820 },
      { character_name: 'HolyPriest', guild_name: 'Legends', kills: 26, deaths: 22, assists: 31, score: 1640 },
      { character_name: 'IronShield', guild_name: 'Warriors', kills: 21, deaths: 19, assists: 28, score: 1420 },
      { character_name: 'BladeStorm', guild_name: 'Inferno', kills: 19, deaths: 21, assists: 14, score: 1180 },
      { character_name: 'CrimsonMage', guild_name: 'Legends', kills: 17, deaths: 23, assists: 12, score: 1050 },
      { character_name: 'SkyArcher', guild_name: 'Phoenix', kills: 15, deaths: 25, assists: 18, score: 920 }
    ];

    const procyonPlayers = [
      { character_name: 'MysticRose', guild_name: 'Phoenix', kills: 42, deaths: 15, assists: 21, score: 2640 },
      { character_name: 'ShadowBlade', guild_name: 'Vortex', kills: 35, deaths: 16, assists: 17, score: 2180 },
      { character_name: 'IceQueen', guild_name: 'Phoenix', kills: 31, deaths: 20, assists: 19, score: 1950 },
      { character_name: 'NightHunter', guild_name: 'Vortex', kills: 24, deaths: 19, assists: 22, score: 1520 },
      { character_name: 'StormForce', guild_name: 'Phoenix', kills: 22, deaths: 17, assists: 16, score: 1380 },
      { character_name: 'DarkAngel', guild_name: 'Vortex', kills: 18, deaths: 24, assists: 20, score: 1120 },
      { character_name: 'FrostBite', guild_name: 'Phoenix', kills: 16, deaths: 26, assists: 15, score: 970 },
      { character_name: 'LightGuard', guild_name: 'Vortex', kills: 14, deaths: 28, assists: 24, score: 840 }
    ];

    for (const player of capellaPlayers) {
      await base44.asServiceRole.entities.TGWarPlayerScore.create({
        match_id: match.id,
        faction: 'CAPELLA',
        ...player
      });
    }

    for (const player of procyonPlayers) {
      await base44.asServiceRole.entities.TGWarPlayerScore.create({
        match_id: match.id,
        faction: 'PROCYON',
        ...player
      });
    }

    // Create events
    const events = [
      {
        match_id: match.id,
        timestamp: new Date(Date.now() - 120000).toISOString(),
        faction: 'CAPELLA',
        type: 'TOWER_DESTROYED',
        description: 'DarkKnight destruiu a Torre Sul de Procyon!'
      },
      {
        match_id: match.id,
        timestamp: new Date(Date.now() - 180000).toISOString(),
        faction: 'PROCYON',
        type: 'KILL_STREAK',
        description: 'MysticRose eliminou 5 inimigos em sequência (RAMPAGE)!'
      },
      {
        match_id: match.id,
        timestamp: new Date(Date.now() - 240000).toISOString(),
        faction: 'CAPELLA',
        type: 'BASE_CAPTURED',
        description: 'Capella capturou a Base Central!'
      },
      {
        match_id: match.id,
        timestamp: new Date(Date.now() - 300000).toISOString(),
        faction: 'PROCYON',
        type: 'GUARDIAN_KILLED',
        description: 'ShadowBlade matou o Guardião de Capella!'
      },
      {
        match_id: match.id,
        timestamp: new Date(Date.now() - 360000).toISOString(),
        faction: 'CAPELLA',
        type: 'TOWER_DESTROYED',
        description: 'ThunderGod destruiu a Torre Leste de Procyon!'
      },
      {
        match_id: match.id,
        timestamp: new Date(Date.now() - 420000).toISOString(),
        faction: 'PROCYON',
        type: 'BASE_CAPTURED',
        description: 'Procyon capturou a Base Norte!'
      },
      {
        match_id: match.id,
        timestamp: new Date(Date.now() - 480000).toISOString(),
        faction: 'CAPELLA',
        type: 'KILL_STREAK',
        description: 'FireStorm está em sequência de 3 kills consecutivas!'
      },
      {
        match_id: match.id,
        timestamp: new Date(Date.now() - 540000).toISOString(),
        faction: 'PROCYON',
        type: 'TOWER_DESTROYED',
        description: 'IceQueen destruiu a Torre Oeste de Capella!'
      },
      {
        match_id: match.id,
        timestamp: new Date(Date.now() - 600000).toISOString(),
        faction: 'NEUTRAL',
        type: 'ANNOUNCEMENT',
        description: 'A Guerra de Território começou! Boa sorte guerreiros!'
      }
    ];

    for (const event of events) {
      await base44.asServiceRole.entities.TGWarEvent.create(event);
    }

    return Response.json({
      success: true,
      message: 'Guerra demo criada com sucesso',
      match,
      players_created: capellaPlayers.length + procyonPlayers.length,
      events_created: events.length
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});