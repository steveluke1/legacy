import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { type, alz_amount, item_name, item_description, quantity_units, price_brl, seller_notes } = body;

    // Validation
    if (!type || !['ALZ', 'ITEM'].includes(type)) {
      return Response.json({ success: false, error: 'Tipo inválido' }, { status: 400 });
    }

    if (!price_brl || price_brl <= 0) {
      return Response.json({ success: false, error: 'Preço inválido' }, { status: 400 });
    }

    if (type === 'ALZ' && (!alz_amount || alz_amount <= 0)) {
      return Response.json({ success: false, error: 'Quantidade de ALZ inválida' }, { status: 400 });
    }

    if (type === 'ITEM' && (!item_name || !item_description || !quantity_units || quantity_units <= 0)) {
      return Response.json({ success: false, error: 'Dados do item incompletos' }, { status: 400 });
    }

    // Create listing
    const listing = await base44.entities.MarketListing.create({
      seller_user_id: user.id,
      seller_username: user.username || user.full_name,
      type,
      alz_amount: type === 'ALZ' ? alz_amount : null,
      item_name: type === 'ITEM' ? item_name : null,
      item_description: type === 'ITEM' ? item_description : null,
      quantity_units: type === 'ITEM' ? quantity_units : null,
      price_brl,
      seller_notes: seller_notes || '',
      status: 'ACTIVE'
    });

    // Log action
    await base44.entities.MarketAuditLog.create({
      action: 'LISTING_CREATED',
      user_id: user.id,
      username: user.username || user.full_name,
      listing_id: listing.id,
      metadata_json: JSON.stringify({ type, price_brl })
    });

    return Response.json({ success: true, listing });
  } catch (error) {
    console.error('Error creating listing:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});