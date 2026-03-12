import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      console.error(`[${requestId}] Unauthorized mystery box list`);
      return Response.json({ 
        success: false, 
        error: 'Não autorizado' 
      }, { status: 401 });
    }
    
    console.log(`[${requestId}] User ${user.id} fetching mystery boxes`);

    // Get mystery box type
    const lootBoxTypes = await base44.asServiceRole.entities.LootBoxType.filter({ 
      slug: 'caixa-misteriosa-tchapi' 
    });
    
    if (lootBoxTypes.length === 0) {
      return Response.json({
        success: true,
        boxes: []
      });
    }

    const lootBoxType = lootBoxTypes[0];

    // Get user's mystery boxes
    const userBoxes = await base44.asServiceRole.entities.UserLootBox.filter({
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

    console.log(`[${requestId}] Returning ${boxes.length} mystery boxes`);

    return Response.json({
      success: true,
      boxes
    });

  } catch (error) {
    console.error(`[${requestId}] Error:`, error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});