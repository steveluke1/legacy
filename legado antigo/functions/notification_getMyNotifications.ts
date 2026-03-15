import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    
    const { token, limit = 20, unread_only = false } = body;
    
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

    let notifications;
    
    if (unread_only) {
      notifications = await base44.asServiceRole.entities.Notification.filter({
        user_id: user.id,
        viewed_at: null
      }, '-created_date', limit);
    } else {
      notifications = await base44.asServiceRole.entities.Notification.filter({
        user_id: user.id
      }, '-created_date', limit);
    }

    const unreadCount = await base44.asServiceRole.entities.Notification.filter({
      user_id: user.id,
      viewed_at: null
    });

    return Response.json({
      success: true,
      notifications,
      unread_count: unreadCount.length
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});