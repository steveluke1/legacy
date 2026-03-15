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

    // Check if already seeded
    const existingMatches = await base44.asServiceRole.entities.TGWarMatch.list(null, 20);
    if (existingMatches.length >= 20) {
      return Response.json({
        success: true,
        message: 'Dados de TG massivos já existem',
        matches_count: existingMatches.length
      });
    }

    const matches = [];
    const now = new Date();

    // Create 30 matches over last 14 days
    for (let i = 0; i < 30; i++) {
      const daysAgo = Math.floor((i / 30) * 14);
      const matchDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      
      const isFinished = i > 2; // Last 2 are in progress or scheduled
      const status = i === 0 ? 'IN_PROGRESS' : (i === 1 ? 'SCHEDULED' : 'FINISHED');
      
      const capellaScore = Math.floor(Math.random() * 50000) + 30000;
      const procyonScore = Math.floor(Math.random() * 50000) + 30000;
      
      const match = await base44.asServiceRole.entities.TGWarMatch.create({
        date: matchDate.toISOString().split('T')[0],
        start_time: matchDate.toISOString(),
        end_time: isFinished ? new Date(matchDate.getTime() + 60 * 60 * 1000).toISOString() : null,
        status: status,
        map_name: 'Tierra Gloriosa',
        capella_score: capellaScore,
        procyon_score: procyonScore,
        capella_kills: Math.floor(Math.random() * 200) + 100,
        procyon_kills: Math.floor(Math.random() * 200) + 100,
        total_players_capella: Math.floor(Math.random() * 30) + 50,
        total_players_procyon: Math.floor(Math.random() * 30) + 50
      });

      matches.push(match);

      // Create events for this match (only for first 10 matches to avoid rate limits)
      if (i < 10) {
        const eventTypes = ['TOWER_DESTROYED', 'BASE_CAPTURED', 'GUARDIAN_KILLED', 'KILL_STREAK', 'ANNOUNCEMENT'];
        const factions = ['CAPELLA', 'PROCYON', 'NEUTRAL'];
        
        for (let j = 0; j < 5; j++) {
        const eventTime = new Date(matchDate.getTime() + j * 10 * 60 * 1000);
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const faction = factions[Math.floor(Math.random() * factions.length)];
        
        let description = '';
        if (eventType === 'TOWER_DESTROYED') {
          description = `${faction} destruiu uma torre inimiga`;
        } else if (eventType === 'BASE_CAPTURED') {
          description = `${faction} capturou a Base Central`;
        } else if (eventType === 'GUARDIAN_KILLED') {
          description = `${faction} eliminou o Guardian inimigo`;
        } else if (eventType === 'KILL_STREAK') {
          description = `Jogador alcançou ${Math.floor(Math.random() * 30) + 20} kills consecutivos`;
        } else {
          description = `Guerra intensifica no setor ${Math.floor(Math.random() * 5) + 1}`;
        }

        await base44.asServiceRole.entities.TGWarEvent.create({
          match_id: match.id,
          timestamp: eventTime.toISOString(),
          faction: faction,
          type: eventType,
          description: description
        });
        }
      }

      // Create player scores for this match (top 50, only for first 5 matches)
      if (i < 5) {
        const profiles = await base44.asServiceRole.entities.CharacterProfile.list(null, 50);
      
      for (let k = 0; k < Math.min(50, profiles.length); k++) {
        const profile = profiles[k];
        const playerFaction = Math.random() > 0.5 ? 'CAPELLA' : 'PROCYON';
        
        await base44.asServiceRole.entities.TGWarPlayerScore.create({
          match_id: match.id,
          character_name: profile.character_name,
          guild_name: profile.guild_name,
          faction: playerFaction,
          kills: Math.floor(Math.random() * 50) + 10,
          assists: Math.floor(Math.random() * 30) + 5,
          deaths: Math.floor(Math.random() * 20) + 2,
          score: Math.floor(Math.random() * 5000) + 1000
        });
        }
      }

      // Delay between matches
      if (i % 5 === 0 && i > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return Response.json({
      success: true,
      message: `${matches.length} guerras de TG criadas com sucesso`,
      matches_created: matches.length
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});