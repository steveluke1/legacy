import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BUILD_SIGNATURE = 'NOTIFICATIONS-V1-20251228';

Deno.serve(async (req) => {
  const correlationId = `notif-mark-all-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
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
    
    const { token } = body;
    
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

    // Get all unread notifications for this user
    const unreadNotifications = await base44.asServiceRole.entities.Notification.filter({
      user_id: user.id,
      viewed_at: null
    }, undefined, 1000); // Max 1000 at once

    if (unreadNotifications.length === 0) {
      return Response.json({
        success: true,
        data: {
          message: 'Nenhuma notificação não lida.',
          marked_count: 0,
          correlation_id: correlationId
        }
      }, { status: 200 });
    }

    // Mark all as read
    const now = new Date().toISOString();
    const updatePromises = unreadNotifications.map(notif =>
      base44.asServiceRole.entities.Notification.update(notif.id, {
        viewed_at: now
      })
    );

    await Promise.all(updatePromises);

    return Response.json({
      success: true,
      data: {
        message: 'Todas as notificações foram marcadas como lidas.',
        marked_count: unreadNotifications.length,
        correlation_id: correlationId
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error(`[notificationMarkAllRead:${correlationId}] ERROR:`, error.message);
    
    return Response.json({
      success: false,
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'Erro ao marcar notificações.'
      }
    }, { status: 500 });
  }
});