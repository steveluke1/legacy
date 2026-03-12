import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get start of current week (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + diff);
    weekStart.setHours(0, 0, 0, 0);

    // Get all DG completions (REAL ONLY)
    const allDgCompletions = await base44.asServiceRole.entities.DGCompletion.filter({}, '-completed_at', 2000);
    
    // Filter to REAL data only
    const realDgCompletions = allDgCompletions.filter(dg =>
      (dg.is_real === true || dg.source === 'GAME_SERVER') &&
      new Date(dg.completed_at || dg.created_date) >= weekStart
    );

    const playerScores = {};

    realDgCompletions.forEach(dg => {
      const player = dg.player_name || dg.character_name;
      if (!playerScores[player]) {
        playerScores[player] = {
          player_name: player,
          guild: dg.guild_name || 'Sem Guild',
          score: 0,
          dgs_counted: 0
        };
      }
      playerScores[player].score += 1;
      playerScores[player].dgs_counted += 1;
    });

    // Sort and add position
    const ranking = Object.values(playerScores)
      .sort((a, b) => b.score - a.score)
      .map((player, index) => ({
        ...player,
        position: index + 1
      }));

    return Response.json({
      success: true,
      data: {
        available: ranking.length > 0,
        ranking: ranking.slice(0, 100),
        week_range: `${weekStart.toLocaleDateString('pt-BR')} - ${now.toLocaleDateString('pt-BR')}`,
        total_participants: ranking.length
      }
    });

  } catch (error) {
    console.error('[corredoresGetWeeklyRanking] Error:', error);
    return Response.json({ 
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    }, { status: 500 });
  }
});