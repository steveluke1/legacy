import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BUILD_SIGNATURE = 'NOTIFICATIONS-V1-20251228';

Deno.serve(async (req) => {
  const correlationId = `notif-mark-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const base44 = createClientFromRequest(req);
    
    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json({
        success: false,
        error: { code: 'INVALID_BODY', message: 'Dados inválidos.' }
      }, { status: 400 });
    }
    
    const { token, notification_id } = body;
    
    // Verify token
    if (!token) {
      return Response.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Você precisa estar logado.' }
      }, { status: 401 });
    }
    
    let verifyResponse;
    try {
      verifyResponse = await base44.functions.invoke('auth_me', { token });
    } catch (e) {
      return Response.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Token inválido.' }
      }, { status: 401 });
    }
    
    if (!verifyResponse.data?.success || !verifyResponse.data?.user) {
      return Response.json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Token inválido.' }
      }, { status: 401 });
    }
    
    const user = verifyResponse.data.user;

    if (!notification_id) {
      return Response.json({
        success: false,
        error: { code: 'MISSING_FIELD', message: 'notification_id é obrigatório.' }
      }, { status: 400 });
    }

    // Get notification
    const notifications = await base44.asServiceRole.entities.Notification.filter({ 
      id: notification_id 
    });
    
    if (notifications.length === 0) {
      return Response.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Notificação não encontrada.' }
      }, { status: 404 });
    }

    const notification = notifications[0];

    // Check ownership
    if (notification.user_id !== user.id) {
      return Response.json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Você não pode marcar esta notificação.' }
      }, { status: 403 });
    }

    // Idempotency: skip if already marked
    if (notification.viewed_at) {
      return Response.json({
        success: true,
        data: {
          message: 'Notificação já marcada como lida.',
          already_read: true,
          correlation_id: correlationId
        }
      }, { status: 200 });
    }

    // Update
    await base44.asServiceRole.entities.Notification.update(notification_id, {
      viewed_at: new Date().toISOString()
    });

    return Response.json({
      success: true,
      data: {
        message: 'Notificação marcada como lida.',
        correlation_id: correlationId
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error(`[notificationMarkRead:${correlationId}] ERROR:`, error.message);
    
    return Response.json({
      success: false,
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'Erro ao marcar notificação.'
      }
    }, { status: 500 });
  }
});