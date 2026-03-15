import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get start of current week
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + diff);
    weekStart.setHours(0, 0, 0, 0);

    // Get all DG completions from this week
    const dgCompletions = await base44.asServiceRole.entities.DGCompletion.filter({}, '-completed_at', 2000);

    const playerScores = {};

    dgCompletions.forEach(dg => {
      const dgDate = new Date(dg.completed_at || dg.created_date);
      if (dgDate >= weekStart) {
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

    // Sort and add position
    const ranking = Object.values(playerScores)
      .sort((a, b) => b.score - a.score)
      .map((player, index) => ({
        ...player,
        position: index + 1
      }));

    return Response.json({
      success: true,
      ranking: ranking.slice(0, 100),
      week_range: `${weekStart.toLocaleDateString('pt-BR')} - ${now.toLocaleDateString('pt-BR')}`,
      total_participants: ranking.length
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});