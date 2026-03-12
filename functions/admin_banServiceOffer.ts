import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({
        success: false,
        error: 'Apenas administradores podem banir ofertas.'
      }, { status: 403 });
    }

    const { offer_id, reason } = await req.json();

    if (!offer_id) {
      return Response.json({
        success: false,
        error: 'offer_id é obrigatório.'
      }, { status: 400 });
    }

    // Get offer
    const offers = await base44.asServiceRole.entities.ServiceOffer.filter({ id: offer_id });
    
    if (offers.length === 0) {
      return Response.json({
        success: false,
        error: 'Oferta não encontrada.'
      }, { status: 404 });
    }

    const offer = offers[0];

    // Update offer status
    await base44.asServiceRole.entities.ServiceOffer.update(offer_id, {
      status: 'BANNED',
      is_active: false
    });

    // Create audit log
    await base44.asServiceRole.entities.MarketAuditLog.create({
      action: 'SERVICE_OFFER_BANNED',
      user_id: user.id,
      username: user.username || user.full_name,
      listing_id: offer_id,
      metadata_json: JSON.stringify({
        reason: reason || 'Banido por administrador',
        provider_user_id: offer.provider_user_id
      })
    });

    // Notify provider
    await base44.asServiceRole.functions.invoke('notification_create', {
      user_id: offer.provider_user_id,
      message: 'Sua oferta de serviço foi suspensa pela administração.',
      type: 'admin_action',
      related_entity_id: offer_id
    });

    return Response.json({
      success: true,
      message: 'Oferta banida com sucesso',
      offer_id: offer_id
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});