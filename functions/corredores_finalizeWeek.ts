import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get last week's data
    const now = new Date();
    const lastWeekEnd = new Date(now);
    lastWeekEnd.setDate(now.getDate() - now.getDay());
    lastWeekEnd.setHours(23, 59, 59, 999);
    
    const lastWeekStart = new Date(lastWeekEnd);
    lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
    lastWeekStart.setHours(0, 0, 0, 0);

    // Get ranking for last week
    const dgCompletions = await base44.asServiceRole.entities.DGCompletion.filter({}, '-completed_at', 2000);

    const playerScores = {};

    dgCompletions.forEach(dg => {
      const dgDate = new Date(dg.completed_at || dg.created_date);
      if (dgDate >= lastWeekStart && dgDate <= lastWeekEnd) {
        const player = dg.player_name;
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
      }
    });

    const ranking = Object.values(playerScores)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30)
      .map((player, index) => ({
        ...player,
        position: index + 1
      }));

    if (ranking.length > 0) {
      // Store weekly record
      await base44.asServiceRole.entities.WeeklyRecord.create({
        week_start: lastWeekStart.toISOString().split('T')[0],
        week_end: lastWeekEnd.toISOString().split('T')[0],
        champion_name: ranking[0].player_name,
        champion_guild: ranking[0].guild,
        champion_points: ranking[0].score,
        top_players: ranking,
        type: 'CORREDOR'
      });
    }

    return Response.json({
      success: true,
      message: 'Semana finalizada e histórico armazenado',
      champion: ranking[0] || null,
      total_recorded: ranking.length
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});