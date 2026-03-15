import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const GIFT_CARD_PRODUCTS = {
  'GIFT_BRONZE': { tier: 'BRONZE', price_cash: 200, quantity: 1 },
  'GIFT_PRATA': { tier: 'PRATA', price_cash: 500, quantity: 1 },
  'GIFT_OURO': { tier: 'OURO', price_cash: 1000, quantity: 1 }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const { product_id } = await req.json();
    const product = GIFT_CARD_PRODUCTS[product_id];

    if (!product) {
      return Response.json({ 
        success: false,
        error: 'Produto não encontrado.' 
      }, { status: 400 });
    }

    // Get user account
    const userAccounts = await base44.asServiceRole.entities.UserAccount.filter({
      user_id: user.id
    });

    if (userAccounts.length === 0 || (userAccounts[0].crystal_fragments || 0) < product.price_cash) {
      return Response.json({ 
        success: false,
        error: 'Você não tem Cash suficiente para comprar este cartão de presente.' 
      }, { status: 400 });
    }

    const userAccount = userAccounts[0];
    const newBalance = userAccount.crystal_fragments - product.price_cash;

    // Update balance
    await base44.asServiceRole.entities.UserAccount.update(userAccount.id, {
      crystal_fragments: newBalance
    });

    // Update or create gift card inventory
    const inventory = await base44.asServiceRole.entities.GiftCardInventory.filter({
      user_id: user.id,
      tier: product.tier
    });

    if (inventory.length > 0) {
      await base44.asServiceRole.entities.GiftCardInventory.update(inventory[0].id, {
        quantity: inventory[0].quantity + product.quantity
      });
    } else {
      await base44.asServiceRole.entities.GiftCardInventory.create({
        user_id: user.id,
        tier: product.tier,
        quantity: product.quantity
      });
    }

    // Log
    await base44.asServiceRole.entities.MarketAuditLog.create({
      action: 'ORDER_PAID',
      user_id: user.id,
      username: user.full_name,
      metadata_json: JSON.stringify({
        type: 'STORE_GIFT_CARD_PURCHASE',
        product_id,
        tier: product.tier,
        price_cash: product.price_cash,
        quantity: product.quantity,
        new_balance: newBalance
      })
    });

    return Response.json({
      success: true,
      message: 'Compra realizada com sucesso. O cartão de presente foi adicionado à sua conta.',
      new_cash_balance: newBalance
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});