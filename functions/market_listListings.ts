import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { generateCorrelationId } from './_shared/marketHelpers.js';

Deno.serve(async (req) => {
  const correlationId = generateCorrelationId();
  
  try {
    const base44 = createClientFromRequest(req);
    
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const sortBy = url.searchParams.get('sortBy') || '-created_date';
    
    // Buscar listings ativos
    const skip = (page - 1) * limit;
    const listings = await base44.asServiceRole.entities.AlzListing.filter(
      { status: 'active' },
      sortBy,
      limit,
      skip
    );
    
    // Contar total
    const allListings = await base44.asServiceRole.entities.AlzListing.filter({ status: 'active' });
    const total = allListings.length;
    
    return Response.json({
      success: true,
      listings: listings.map(l => ({
        listing_id: l.listing_id,
        seller_character_name: l.seller_character_name,
        alz_amount: l.alz_amount,
        price_brl: l.price_brl,
        price_per_billion: (l.price_brl / l.alz_amount) * 1000000000,
        expires_at: l.expires_at,
        created_date: l.created_date
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      correlationId,
      notes: {
        source: 'AlzListing',
        dataQuality: 'ok'
      }
    }, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: 'Erro ao listar anúncios',
      correlationId
    }, {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});