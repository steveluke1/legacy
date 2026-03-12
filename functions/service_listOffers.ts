import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    
    const category = url.searchParams.get('category');
    const dungeon_code = url.searchParams.get('dungeon_code');
    const search = url.searchParams.get('search');
    const min_price = url.searchParams.get('min_price');
    const max_price = url.searchParams.get('max_price');
    const price_type = url.searchParams.get('price_type');

    // Build filter
    const filter = {
      is_active: true,
      status: 'ACTIVE'
    };

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (dungeon_code) {
      filter.dungeon_code = dungeon_code;
    }

    if (price_type && price_type !== 'all') {
      filter.price_type = price_type;
    }

    // Get offers
    let offers = await base44.asServiceRole.entities.ServiceOffer.filter(filter, '-created_date', 50);

    // Client-side filtering for search and price range
    if (search) {
      const searchLower = search.toLowerCase();
      offers = offers.filter(o => 
        o.title.toLowerCase().includes(searchLower) ||
        o.description.toLowerCase().includes(searchLower)
      );
    }

    if (min_price) {
      const minVal = parseFloat(min_price);
      offers = offers.filter(o => {
        const price = o.price_type === 'BRL' ? o.price_brl : o.price_cash;
        return price >= minVal;
      });
    }

    if (max_price) {
      const maxVal = parseFloat(max_price);
      offers = offers.filter(o => {
        const price = o.price_type === 'BRL' ? o.price_brl : o.price_cash;
        return price <= maxVal;
      });
    }

    // Enrich with provider data
    const enrichedOffers = await Promise.all(offers.map(async (offer) => {
      try {
        const provider = await base44.asServiceRole.entities.User.filter({ id: offer.provider_user_id });
        
        // Get provider ratings
        const ratings = await base44.asServiceRole.entities.MarketReputation.filter({
          seller_user_id: offer.provider_user_id
        });
        
        const avgRating = ratings.length > 0
          ? (ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length).toFixed(1)
          : null;

        return {
          ...offer,
          provider_name: provider[0]?.username || provider[0]?.full_name || offer.provider_user_id || 'Prestador',
          provider_rating: avgRating,
          provider_ratings_count: ratings.length
        };
      } catch (e) {
        // Se não encontrar o usuário, usa o provider_user_id como nome
        return {
          ...offer,
          provider_name: offer.provider_user_id || 'Prestador',
          provider_rating: null,
          provider_ratings_count: 0
        };
      }
    }));

    return Response.json({
      success: true,
      offers: enrichedOffers
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});