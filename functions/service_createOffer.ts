import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ 
        success: false,
        error: 'Você precisa estar logado para criar uma oferta de serviço.' 
      }, { status: 401 });
    }

    // Check RMT terms acceptance
    const termsAccepted = await base44.asServiceRole.entities.MarketTermsAccepted.filter({
      user_id: user.id
    });

    if (termsAccepted.length === 0) {
      return Response.json({
        success: false,
        error: 'Você precisa aceitar os Termos do Mercado ZIRON antes de criar um serviço.',
        redirect: '/mercado/termos'
      }, { status: 403 });
    }

    const {
      title,
      description,
      category,
      dungeon_code,
      min_level_required,
      price_type,
      price_brl,
      price_cash,
      estimated_duration_minutes,
      max_slots
    } = await req.json();

    // Validation
    if (!title || title.length < 5) {
      return Response.json({
        success: false,
        error: 'O título deve ter pelo menos 5 caracteres.'
      }, { status: 400 });
    }

    if (!description || description.length < 20) {
      return Response.json({
        success: false,
        error: 'A descrição deve ter pelo menos 20 caracteres.'
      }, { status: 400 });
    }

    if (!category) {
      return Response.json({
        success: false,
        error: 'Selecione uma categoria válida.'
      }, { status: 400 });
    }

    if (!price_type || !['BRL', 'CASH'].includes(price_type)) {
      return Response.json({
        success: false,
        error: 'Selecione um tipo de pagamento válido.'
      }, { status: 400 });
    }

    if (price_type === 'BRL' && (!price_brl || price_brl <= 0)) {
      return Response.json({
        success: false,
        error: 'O preço em reais deve ser maior que zero.'
      }, { status: 400 });
    }

    if (price_type === 'CASH' && (!price_cash || price_cash <= 0)) {
      return Response.json({
        success: false,
        error: 'O preço em cash deve ser maior que zero.'
      }, { status: 400 });
    }

    if (!estimated_duration_minutes || estimated_duration_minutes <= 0) {
      return Response.json({
        success: false,
        error: 'A duração estimada deve ser maior que zero.'
      }, { status: 400 });
    }

    // Create offer
    const offer = await base44.asServiceRole.entities.ServiceOffer.create({
      provider_user_id: user.id,
      title,
      description,
      category,
      dungeon_code: dungeon_code || null,
      min_level_required: min_level_required || null,
      price_type,
      price_brl: price_type === 'BRL' ? price_brl : null,
      price_cash: price_type === 'CASH' ? price_cash : null,
      estimated_duration_minutes,
      max_slots: max_slots || null,
      is_active: true,
      status: 'ACTIVE'
    });

    // Log action
    await base44.asServiceRole.entities.MarketAuditLog.create({
      action: 'SERVICE_OFFER_CREATED',
      user_id: user.id,
      username: user.username || user.full_name,
      metadata_json: JSON.stringify({ offer_id: offer.id, title, category })
    });

    return Response.json({
      success: true,
      offer
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});