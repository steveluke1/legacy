import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ 
        success: false, 
        error: 'Não autorizado' 
      }, { status: 401 });
    }

    // Get user's extensors
    const userExtensors = await base44.entities.UserExtensor.filter({ user_id: user.id });

    // Get all templates
    const templateIds = [...new Set(userExtensors.map(e => e.extensor_template_id))];
    const templates = {};
    
    for (const templateId of templateIds) {
      const tmpl = await base44.entities.ExtensorTemplate.filter({ id: templateId });
      if (tmpl.length > 0) {
        templates[templateId] = tmpl[0];
      }
    }

    // Map extensors with template data
    const extensors = userExtensors.map(extensor => {
      const template = templates[extensor.extensor_template_id];
      return {
        userExtensorId: extensor.id,
        templateSlug: template?.slug || '',
        name: template?.name || 'Unknown',
        description: template?.description || '',
        tier: template?.tier || 'baixo',
        rarityColorHex: template?.rarityColorHex || '#9CA3AF',
        iconUrl: template?.iconUrl || '',
        obtainedAt: extensor.obtained_at,
        quantity: extensor.quantity
      };
    });

    return Response.json({
      success: true,
      extensors
    });

  } catch (error) {
    console.error('Get extensors error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});