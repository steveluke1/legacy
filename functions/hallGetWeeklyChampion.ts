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

    // Get TG kills (REAL ONLY)
    const allTgKills = await base44.asServiceRole.entities.TGWarPlayerScore.filter({}, '-created_date', 1000);
    const realTgKills = allTgKills.filter(kill =>
      (kill.is_real === true || kill.source === 'GAME_SERVER') &&
      new Date(kill.created_date) >= weekStart
    );
    
    // Get DG completions (REAL ONLY)
    const allDgCompletions = await base44.asServiceRole.entities.DGCompletion.filter({}, '-completed_at', 1000);
    const realDgCompletions = allDgCompletions.filter(dg =>
      (dg.is_real === true || dg.source === 'GAME_SERVER') &&
      new Date(dg.completed_at || dg.created_date) >= weekStart
    );

    // Calculate points per player
    const playerScores = {};

    // TG kills (5 points each)
    realTgKills.forEach(kill => {
      const player = kill.character_name;
      if (!playerScores[player]) {
        playerScores[player] = {
          name: player,
          guild: kill.guild_name || '',
          tg_kills: 0,
          dg_completions: 0,
          points: 0
        };
      }
      playerScores[player].tg_kills += (kill.kills || 0);
      playerScores[player].points += (kill.kills || 0) * 5;
    });

    // DG completions (1 point each)
    realDgCompletions.forEach(dg => {
      const player = dg.player_name || dg.character_name;
      if (!playerScores[player]) {
        playerScores[player] = {
          name: player,
          guild: dg.guild_name || '',
          tg_kills: 0,
          dg_completions: 0,
          points: 0
        };
      }
      playerScores[player].dg_completions += 1;
      playerScores[player].points += 1;
    });

    // Get top player
    const topPlayers = Object.values(playerScores).sort((a, b) => b.points - a.points);
    
    const weekRange = `${weekStart.toLocaleDateString('pt-BR')} - ${now.toLocaleDateString('pt-BR')}`;
    
    if (topPlayers.length === 0) {
      return Response.json({
        success: true,
        data: {
          available: false,
          champion: null,
          week_range: weekRange
        }
      });
    }

    const champion = topPlayers[0];

    return Response.json({
      success: true,
      data: {
        available: true,
        champion: {
          player_name: champion.name,
          guild: champion.guild,
          points: champion.points,
          kills_registered: champion.tg_kills,
          dg_concluded: champion.dg_completions,
          position: 1
        },
        week_range: weekRange
      }
    });

  } catch (error) {
    console.error('[hallGetWeeklyChampion] Error:', error);
    return Response.json({ 
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    }, { status: 500 });
  }
});