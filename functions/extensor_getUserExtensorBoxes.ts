import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ 
        success: false, 
        error: 'Não autorizado' 
      }, { status: 401 });
    }

    // Get the extensor loot box type
    const lootBoxTypes = await base44.entities.LootBoxType.filter({ slug: 'caixa-extensor-tchope' });
    
    if (lootBoxTypes.length === 0) {
      return Response.json({
        success: true,
        boxes: []
      });
    }

    const lootBoxType = lootBoxTypes[0];

    // Get user's extensor boxes
    const userBoxes = await base44.entities.UserLootBox.filter({
      user_id: user.id,
      loot_box_type_id: lootBoxType.id
    });

    const boxes = userBoxes.map(box => ({
      id: box.id,
      status: box.status,
      createdAt: box.created_date,
      openedAt: box.opened_at,
      lootBoxTypeSlug: lootBoxType.slug,
      lootBoxTypeName: lootBoxType.name
    }));

    return Response.json({
      success: true,
      boxes
    });

  } catch (error) {
    console.error('Get boxes error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});