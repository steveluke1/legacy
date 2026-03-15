import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const BUILD_SIGNATURE = 'NOTIFICATIONS-V1-20251228';

Deno.serve(async (req) => {
  const correlationId = `notif-get-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const base44 = createClientFromRequest(req);
    
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    
    const { token, limit = 20, cursor } = body;
    
    // Verify token (custom auth)
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

    // Fetch notifications with pagination
    const notifications = await base44.asServiceRole.entities.Notification.filter({
      user_id: user.id
    }, '-created_date', limit);

    // Get unread count
    const unreadNotifications = await base44.asServiceRole.entities.Notification.filter({
      user_id: user.id,
      viewed_at: null
    });

    return Response.json({
      success: true,
      data: {
        notifications,
        unread_count: unreadNotifications.length,
        has_more: notifications.length === limit,
        build_signature: BUILD_SIGNATURE,
        correlation_id: correlationId
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error(`[notificationGetMyNotifications:${correlationId}] ERROR:`, error.message);
    
    return Response.json({
      success: false,
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'Erro ao carregar notificações.'
      }
    }, { status: 500 });
  }
});