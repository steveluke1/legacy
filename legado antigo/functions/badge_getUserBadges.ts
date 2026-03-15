import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.error(`[${requestId}] Unauthorized badge list attempt`);
      return Response.json({
        success: false,
        error: 'Usuário não autenticado'
      }, { status: 401 });
    }
    
    console.log(`[${requestId}] User ${user.id} fetching badges`);

    // Get user's badges
    const userBadges = await base44.asServiceRole.entities.UserBadge.filter({
      user_id: user.id
    });

    // Get all badge templates
    const allTemplates = await base44.asServiceRole.entities.BadgeTemplate.list();
    const templateMap = {};
    allTemplates.forEach(t => {
      templateMap[t.id] = t;
    });

    // Format response
    const badges = userBadges.map(ub => {
      const template = templateMap[ub.badge_template_id] || {};
      return {
        userBadgeId: ub.id,
        templateSlug: template.slug,
        name: template.name,
        description: template.description,
        rarity: template.rarity,
        colorHex: template.colorHex,
        iconUrl: template.iconUrl,
        animatedEffectKey: template.animatedEffectKey,
        obtainedFrom: ub.obtained_from,
        obtainedAt: ub.obtained_at,
        isEquipped: ub.is_equipped
      };
    });

    console.log(`[${requestId}] Returning ${badges.length} badges`);

    return Response.json({
      success: true,
      badges
    });

  } catch (error) {
    console.error(`[${requestId}] Error:`, error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});