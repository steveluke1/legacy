import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

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

    // Get TG kills from this week
    const tgKills = await base44.asServiceRole.entities.TGWarPlayerScore.filter({}, '-created_date', 1000);
    
    // Get DG completions from this week
    const dgCompletions = await base44.asServiceRole.entities.DGCompletion.filter({}, '-completed_at', 1000);

    // Calculate points per player
    const playerScores = {};

    // TG kills (5 points each)
    tgKills.forEach(kill => {
      const killDate = new Date(kill.created_date);
      if (killDate >= weekStart) {
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
      }
    });

    // DG completions (1 point each)
    dgCompletions.forEach(dg => {
      const dgDate = new Date(dg.completed_at || dg.created_date);
      if (dgDate >= weekStart) {
        const player = dg.player_name;
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
      }
    });

    // Get top player
    const topPlayers = Object.values(playerScores).sort((a, b) => b.points - a.points);
    
    if (topPlayers.length === 0) {
      return Response.json({
        success: true,
        champion: null,
        week_range: `${weekStart.toLocaleDateString('pt-BR')} - ${now.toLocaleDateString('pt-BR')}`
      });
    }

    const champion = topPlayers[0];

    return Response.json({
      success: true,
      champion: {
        player_name: champion.name,
        guild: champion.guild,
        points: champion.points,
        kills_registered: champion.tg_kills,
        dg_concluded: champion.dg_completions,
        position: 1
      },
      week_range: `${weekStart.toLocaleDateString('pt-BR')} - ${now.toLocaleDateString('pt-BR')}`
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});