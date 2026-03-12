import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mission_type } = await req.json();
    const today = new Date().toISOString().split('T')[0];

    // Find mission
    const missions = await base44.asServiceRole.entities.DailyMission.filter({
      user_id: user.id,
      mission_type,
      date: today,
      completed: false
    });

    if (missions.length === 0) {
      return Response.json({ error: 'Mission not found or already completed' }, { status: 404 });
    }

    const mission = missions[0];

    // Mark as completed
    await base44.asServiceRole.entities.DailyMission.update(mission.id, {
      completed: true,
      completed_at: new Date().toISOString()
    });

    // Get user account
    const userAccounts = await base44.asServiceRole.entities.UserAccount.filter({ user_id: user.id });
    if (userAccounts.length === 0) {
      return Response.json({ error: 'User account not found' }, { status: 404 });
    }

    const userAccount = userAccounts[0];

    // Calculate new exp and level
    const newExp = (userAccount.exp || 0) + mission.exp_reward;
    const newCrystals = (userAccount.crystal_fragments || 0) + mission.crystal_reward;
    let newLevel = userAccount.level || 1;

    // Level up formula: 100 * level
    const expNeeded = 100 * newLevel;
    if (newExp >= expNeeded) {
      newLevel++;
    }

    // Update user account
    await base44.asServiceRole.entities.UserAccount.update(userAccount.id, {
      exp: newExp,
      level: newLevel,
      crystal_fragments: newCrystals
    });

    return Response.json({ 
      success: true,
      exp_gained: mission.exp_reward,
      crystals_gained: mission.crystal_reward,
      new_level: newLevel
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});