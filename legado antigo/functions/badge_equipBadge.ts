import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({
        success: false,
        error: 'Usuário não autenticado'
      }, { status: 401 });
    }

    const body = await req.json();
    const userBadgeId = body.userBadgeId;

    if (!userBadgeId) {
      return Response.json({
        success: false,
        error: 'ID da insígnia não fornecido'
      }, { status: 400 });
    }

    // Verify badge belongs to user
    const userBadges = await base44.asServiceRole.entities.UserBadge.filter({
      id: userBadgeId,
      user_id: user.id
    });

    if (userBadges.length === 0) {
      return Response.json({
        success: false,
        error: 'Insígnia não encontrada ou não pertence ao usuário'
      }, { status: 404 });
    }

    const targetBadge = userBadges[0];

    // Unequip all other badges
    const allUserBadges = await base44.asServiceRole.entities.UserBadge.filter({
      user_id: user.id
    });

    for (const badge of allUserBadges) {
      if (badge.is_equipped) {
        await base44.asServiceRole.entities.UserBadge.update(badge.id, {
          is_equipped: false
        });
      }
    }

    // Equip the target badge
    await base44.asServiceRole.entities.UserBadge.update(targetBadge.id, {
      is_equipped: true,
      equipped_at: new Date().toISOString()
    });

    // Get template info
    const templates = await base44.asServiceRole.entities.BadgeTemplate.filter({
      id: targetBadge.badge_template_id
    });

    const template = templates[0] || {};

    return Response.json({
      success: true,
      message: 'Insígnia equipada com sucesso',
      equippedBadge: {
        userBadgeId: targetBadge.id,
        templateSlug: template.slug,
        name: template.name,
        rarity: template.rarity,
        colorHex: template.colorHex
      }
    });

  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});