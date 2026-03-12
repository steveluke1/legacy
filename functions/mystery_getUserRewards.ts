import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.error(`[${requestId}] Unauthorized mystery rewards list`);
      return Response.json({ 
        success: false, 
        error: 'Não autorizado' 
      }, { status: 401 });
    }
    
    console.log(`[${requestId}] User ${user.id} fetching mystery rewards`);

    // Get user's mystery rewards
    const userRewards = await base44.asServiceRole.entities.UserMysteryReward.filter({ 
      user_id: user.id 
    });

    // Get templates
    const templateIds = [...new Set(userRewards.map(r => r.reward_template_id))];
    const templates = {};
    
    for (const templateId of templateIds) {
      const tmpl = await base44.asServiceRole.entities.MysteryReward.filter({ id: templateId });
      if (tmpl.length > 0) {
        templates[templateId] = tmpl[0];
      }
    }

    // Map rewards with template data
    const rewards = userRewards.map(reward => {
      const template = templates[reward.reward_template_id];
      return {
        userRewardId: reward.id,
        templateSlug: template?.slug || '',
        name: template?.name || 'Unknown',
        description: template?.description || '',
        rewardType: template?.rewardType || 'premium_item',
        rarity: template?.rarity || 'common',
        colorHex: template?.colorHex || '#9CA3AF',
        obtainedAt: reward.obtained_at,
        expiresAt: reward.expires_at,
        isConsumed: reward.is_consumed
      };
    });

    console.log(`[${requestId}] Returning ${rewards.length} mystery rewards`);

    return Response.json({
      success: true,
      rewards
    });

  } catch (error) {
    console.error(`[${requestId}] Error:`, error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});