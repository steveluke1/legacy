import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const listings = await base44.entities.MarketListing.filter(
      { seller_user_id: user.id },
      '-created_date',
      50
    );

    return Response.json({ success: true, listings });
  } catch (error) {
    console.error('Error getting my offers:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});