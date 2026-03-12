import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({
        success: false,
        error: 'Você precisa estar logado.'
      }, { status: 401 });
    }

    const { notification_id } = await req.json();

    if (!notification_id) {
      return Response.json({
        success: false,
        error: 'notification_id é obrigatório.'
      }, { status: 400 });
    }

    // Get notification
    const notifications = await base44.asServiceRole.entities.Notification.filter({ id: notification_id });
    
    if (notifications.length === 0) {
      return Response.json({
        success: false,
        error: 'Notificação não encontrada.'
      }, { status: 404 });
    }

    const notification = notifications[0];

    // Check ownership
    if (notification.user_id !== user.id) {
      return Response.json({
        success: false,
        error: 'Você não pode marcar esta notificação.'
      }, { status: 403 });
    }

    // Update
    await base44.asServiceRole.entities.Notification.update(notification_id, {
      viewed_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      message: 'Notificação marcada como vista'
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});