import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { order_reference } = await req.json();

    // Get IP from request
    const ip = req.headers.get('cf-connecting-ip') || 
                req.headers.get('x-forwarded-for') || 
                'unknown';

    // Create acceptance record
    await base44.asServiceRole.entities.MarketTermsAccepted.create({
      user_id: user.id,
      accepted_at: new Date().toISOString(),
      ip_address: ip,
      order_reference: order_reference || null,
      version: '2.0'
    });

    // Also keep old entity for compatibility
    await base44.asServiceRole.entities.RMTTermsAcceptance.create({
      user_id: user.id,
      accepted_at: new Date().toISOString(),
      ip_address: ip
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});