import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has accepted RMT terms
    const acceptances = await base44.asServiceRole.entities.MarketTermsAccepted.filter({
      user_id: user.id
    });

    const hasAccepted = acceptances.length > 0;

    return Response.json({ 
      success: true, 
      has_accepted: hasAccepted,
      last_acceptance: hasAccepted ? acceptances[acceptances.length - 1] : null
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});