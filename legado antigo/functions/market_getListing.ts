import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { listing_id } = body;

    if (!listing_id) {
      return Response.json({ success: false, error: 'ID do anúncio não fornecido' }, { status: 400 });
    }

    const listings = await base44.entities.MarketListing.filter({ id: listing_id });
    
    if (!listings || listings.length === 0) {
      return Response.json({ success: false, error: 'Anúncio não encontrado' }, { status: 404 });
    }

    return Response.json({ success: true, listing: listings[0] });
  } catch (error) {
    console.error('Error getting listing:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});