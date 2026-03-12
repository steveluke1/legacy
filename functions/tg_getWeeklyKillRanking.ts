import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Fetch all rankings ordered by position
    const rankings = await base44.asServiceRole.entities.WeeklyTGKillRanking.list('position', 10);

    if (rankings.length === 0) {
      return Response.json({
        success: false,
        message: 'No rankings found. Please seed data first.'
      });
    }

    // Get period from first record
    const period = {
      start: rankings[0].reference_period_start,
      end: rankings[0].reference_period_end
    };

    // Format top 10
    const top10 = rankings.map(r => ({
      position: r.position,
      character_name: r.character_name,
      guild_name: r.guild_name,
      nation: r.nation,
      kills: r.kills
    }));

    return Response.json({
      success: true,
      period,
      top10
    });

  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});