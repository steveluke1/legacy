import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { match_id } = await req.json();

    if (!match_id) {
      return Response.json({
        success: false,
        error: 'ID da guerra não fornecido.'
      }, { status: 400 });
    }

    const matches = await base44.asServiceRole.entities.TGWarMatch.filter({ id: match_id });

    if (matches.length === 0) {
      return Response.json({
        success: false,
        error: 'Guerra não encontrada.'
      }, { status: 404 });
    }

    const match = matches[0];

    // Get all events
    const events = await base44.asServiceRole.entities.TGWarEvent.filter({
      match_id
    }, 'timestamp');

    // Get all players
    const players = await base44.asServiceRole.entities.TGWarPlayerScore.filter({
      match_id
    }, '-score');

    return Response.json({
      success: true,
      match,
      events,
      players
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});