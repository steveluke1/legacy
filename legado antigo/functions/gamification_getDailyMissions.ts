import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Get or create user account
    let userAccount = await base44.asServiceRole.entities.UserAccount.filter({ user_id: user.id });
    if (userAccount.length === 0) {
      userAccount = await base44.asServiceRole.entities.UserAccount.create({
        user_id: user.id,
        level: 1,
        exp: 0,
        crystal_fragments: 0,
        reputation_tier: 'Bronze Crystal',
        last_daily_reset: today
      });
    } else {
      userAccount = userAccount[0];
    }

    // Check if need to reset daily missions
    if (userAccount.last_daily_reset !== today) {
      // Delete old missions
      const oldMissions = await base44.asServiceRole.entities.DailyMission.filter({ user_id: user.id });
      for (const mission of oldMissions) {
        await base44.asServiceRole.entities.DailyMission.delete(mission.id);
      }

      // Create new missions
      const missionTypes = ['visit_ranking', 'check_builds', 'check_guilds', 'visit_marketplace'];
      for (const type of missionTypes) {
        await base44.asServiceRole.entities.DailyMission.create({
          user_id: user.id,
          mission_type: type,
          date: today,
          completed: false,
          exp_reward: 50,
          crystal_reward: 5
        });
      }

      // Update last reset
      await base44.asServiceRole.entities.UserAccount.update(userAccount.id, {
        last_daily_reset: today
      });
    }

    // Get today's missions
    const missions = await base44.asServiceRole.entities.DailyMission.filter({ 
      user_id: user.id,
      date: today 
    });

    return Response.json({ 
      success: true, 
      missions,
      user_account: userAccount 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});