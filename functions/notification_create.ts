import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { user_id, message, type, related_entity_id, action_url } = await req.json();

    if (!user_id || !message || !type) {
      return Response.json({
        success: false,
        error: 'user_id, message e type são obrigatórios.'
      }, { status: 400 });
    }

    const notification = await base44.asServiceRole.entities.Notification.create({
      user_id,
      message,
      type,
      related_entity_id: related_entity_id || null,
      action_url: action_url || null
    });

    return Response.json({
      success: true,
      notification
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});