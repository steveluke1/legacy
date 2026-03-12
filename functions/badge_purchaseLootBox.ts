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
    const quantity = body.quantity || 1;

    if (quantity < 1 || quantity > 100) {
      return Response.json({
        success: false,
        error: 'Quantidade inválida. Escolha entre 1 e 100 caixas.'
      }, { status: 400 });
    }

    // Load loot box type
    const lootBoxes = await base44.asServiceRole.entities.LootBoxType.filter({
      slug: "caixa-insignias-ziron"
    });

    if (lootBoxes.length === 0) {
      return Response.json({
        success: false,
        error: 'Caixa de Insígnias não encontrada'
      }, { status: 404 });
    }

    const lootBox = lootBoxes[0];

    if (!lootBox.isActive || lootBox.priceCurrency !== "BRL") {
      return Response.json({
        success: false,
        error: 'Esta caixa não está disponível no momento'
      }, { status: 400 });
    }

    const totalPriceBRL = lootBox.priceValue * quantity;

    // For this implementation, we'll simulate payment success
    // In production, integrate with MercadoPago or existing payment gateway
    
    // Create user loot boxes
    const createdBoxes = [];
    for (let i = 0; i < quantity; i++) {
      const box = await base44.asServiceRole.entities.UserLootBox.create({
        user_id: user.id,
        loot_box_type_id: lootBox.id,
        status: "unopened"
      });
      createdBoxes.push(box);
    }

    const orderId = crypto.randomUUID();
    const idempotencyKey = `badge_loot_${user.id}_${lootBox.slug}_${quantity}_${Date.now()}`;

    // Check for existing order with same idempotency key
    const existingOrders = await base44.asServiceRole.entities.StoreOrder.filter({
      idempotency_key: idempotencyKey
    });

    if (existingOrders.length > 0) {
      // Return existing order
      const existingOrder = existingOrders[0];
      return Response.json({
        success: true,
        message: "Caixas de Insígnias ZIRON compradas com sucesso.",
        totalPriceBRL,
        quantityCreated: quantity,
        boxes: createdBoxes,
        order_id: existingOrder.order_id,
        note: 'Pedido já processado'
      });
    }

    // Create store order with idempotency
    await base44.asServiceRole.entities.StoreOrder.create({
      order_id: orderId,
      idempotency_key: idempotencyKey,
      buyer_user_id: user.id,
      item_type: 'BOX',
      item_sku: lootBox.slug,
      item_name: 'Caixa de Insígnias ZIRON',
      quantity,
      price_brl: totalPriceBRL,
      payment_method: 'BRL',
      status: 'fulfilled',
      fulfilled_at: new Date().toISOString(),
      metadata: { loot_box_type_id: lootBox.id }
    });

    // Log commerce event for analytics (non-blocking)
    try {
      await base44.asServiceRole.entities.CommerceEvent.create({
        eventType: 'BOX_PURCHASE',
        actorUserId: user.id,
        productKey: 'BOX_INSIGNIAS',
        productCategory: 'BOX',
        quantity,
        currency: 'BRL',
        amount: totalPriceBRL,
        amountBrl: totalPriceBRL,
        metadata: { loot_box_slug: lootBox.slug, order_id: orderId },
        correlationId: orderId
      });
    } catch (logError) {
      console.warn('Failed to log commerce event:', orderId, logError.message);
    }

    return Response.json({
      success: true,
      message: "Caixas de Insígnias ZIRON compradas com sucesso.",
      totalPriceBRL,
      quantityCreated: createdBoxes.length,
      boxes: createdBoxes,
      order_id: orderId
    });

  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});