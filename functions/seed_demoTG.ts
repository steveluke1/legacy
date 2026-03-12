import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get demo characters
    const characters = await base44.asServiceRole.entities.CharacterProfile.filter(
      {},
      undefined,
      500
    );

    if (characters.length === 0) {
      return Response.json({
        success: false,
        error: 'Nenhum personagem demo. Execute seed_demoPlayers primeiro.'
      });
    }

    // Check existing
    const existingMatches = await base44.asServiceRole.entities.TGWarMatch.filter({ is_demo: true });
    if (existingMatches.length > 0) {
      return Response.json({
        success: true,
        message: `${existingMatches.length} partidas TG demo já existem`,
        created: { active_match: 0, past_matches: 0, player_scores: 0 }
      });
    }

    // Create 1 active match
    const now = new Date();
    const startTime = new Date(Date.now() - 1800000); // 30 min ago
    const activeMatch = await base44.asServiceRole.entities.TGWarMatch.create({
      date: now.toISOString().split('T')[0],
      start_time: startTime.toISOString(),
      status: 'IN_PROGRESS',
      capella_score: 1200 + Math.floor(Math.random() * 300),
      procyon_score: 1150 + Math.floor(Math.random() * 300),
      is_demo: true
    });

    // Create past matches (20)
    const pastMatches = [];
    for (let i = 0; i < 20; i++) {
      const winner = Math.random() > 0.5 ? 'CAPELLA' : 'PROCYON';
      const daysAgo = Math.floor(Math.random() * 14) + 1;
      const matchDate = new Date(Date.now() - daysAgo * 86400000);

      const startTime = new Date(matchDate.getTime() - 7200000);
      pastMatches.push({
        date: matchDate.toISOString().split('T')[0],
        start_time: startTime.toISOString(),
        end_time: matchDate.toISOString(),
        status: 'FINISHED',
        capella_score: winner === 'CAPELLA' ? 2000 + Math.floor(Math.random() * 500) : 1500 + Math.floor(Math.random() * 300),
        procyon_score: winner === 'PROCYON' ? 2000 + Math.floor(Math.random() * 500) : 1500 + Math.floor(Math.random() * 300),
        is_demo: true
      });
    }

    await base44.asServiceRole.entities.TGWarMatch.bulkCreate(pastMatches);

    // Create player scores for active match
    const participatingPlayers = characters.slice(0, 100);
    const playerScores = [];

    participatingPlayers.forEach(char => {
      const faction = char.nation === 'Capella' ? 'CAPELLA' : 'PROCYON';
      playerScores.push({
        match_id: activeMatch.id,
        character_name: char.character_name,
        guild_name: char.guild_name || '',
        faction: faction,
        kills: Math.floor(Math.random() * 30),
        assists: Math.floor(Math.random() * 50),
        deaths: Math.floor(Math.random() * 20),
        score: Math.floor(Math.random() * 1000) + 100,
        is_demo: true
      });
    });

    await base44.asServiceRole.entities.TGWarPlayerScore.bulkCreate(playerScores);

    return Response.json({
      success: true,
      created: {
        active_match: 1,
        past_matches: pastMatches.length,
        player_scores: playerScores.length
      },
      message: 'TG demo criado com sucesso'
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});