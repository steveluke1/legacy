import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { offer_id } = await req.json();

    if (!offer_id) {
      return Response.json({
        success: false,
        error: 'ID da oferta não fornecido.'
      }, { status: 400 });
    }

    const offers = await base44.asServiceRole.entities.ServiceOffer.filter({ id: offer_id });

    if (offers.length === 0) {
      return Response.json({
        success: false,
        error: 'Serviço não encontrado.'
      }, { status: 404 });
    }

    const offer = offers[0];

    // Get provider info
    const provider = await base44.asServiceRole.entities.User.filter({ id: offer.provider_user_id });
    const providerData = provider[0] || {};

    // Get provider ratings
    const ratings = await base44.asServiceRole.entities.MarketReputation.filter({
      seller_user_id: offer.provider_user_id
    });

    const avgRating = ratings.length > 0
      ? (ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length).toFixed(1)
      : null;

    // Get seller badges (optional)
    let badges = null;
    try {
      const badgesResponse = await base44.asServiceRole.functions.invoke('market_getSellerBadges', {
        seller_user_id: offer.provider_user_id
      });
      if (badgesResponse.data && badgesResponse.data.success) {
        badges = badgesResponse.data.badges;
      }
    } catch (e) {
      // Ignore if function doesn't exist
    }

    return Response.json({
      success: true,
      offer,
      provider: {
        id: providerData.id,
        username: providerData.username || providerData.full_name,
        rating: avgRating,
        ratings_count: ratings.length,
        badges
      }
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});