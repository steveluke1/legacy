import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const { character_id } = await req.json();

    if (!character_id) {
      return Response.json({ 
        success: false,
        error: 'ID do personagem não fornecido.' 
      }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);

    // Try to find by id first
    let profiles = await base44.asServiceRole.entities.CharacterProfile.filter({
      character_id
    });

    // If not found by id, try by character_name
    if (profiles.length === 0) {
      profiles = await base44.asServiceRole.entities.CharacterProfile.filter({
        character_name: character_id
      });
    }

    if (profiles.length === 0) {
      return Response.json({ 
        success: false,
        error: 'Perfil de personagem não encontrado.' 
      }, { status: 200 });
    }

    const profile = profiles[0];

    return Response.json({
      success: true,
      profile
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});