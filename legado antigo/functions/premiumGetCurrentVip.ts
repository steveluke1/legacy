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
    
    const { token } = body;
    
    // Verify token (custom auth)
    if (!token) {
      return Response.json({ 
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Unauthorized' }
      }, { status: 401 });
    }
    
    let verifyResponse;
    try {
      verifyResponse = await base44.functions.invoke('auth_me', { token });
    } catch (e) {
      return Response.json({ 
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Token inválido' }
      }, { status: 401 });
    }
    
    if (!verifyResponse.data?.success || !verifyResponse.data?.user) {
      return Response.json({ 
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Token inválido' }
      }, { status: 401 });
    }
    
    const user = verifyResponse.data.user;

    const subscriptions = await base44.asServiceRole.entities.VipSubscription.filter({
      user_id: user.id,
      is_active: true
    });

    if (subscriptions.length === 0) {
      return Response.json({
        success: true,
        vip: null
      });
    }

    const subscription = subscriptions[0];
    const expiresAt = new Date(subscription.expires_at);
    const now = new Date();

    if (expiresAt <= now) {
      await base44.asServiceRole.entities.VipSubscription.update(subscription.id, {
        is_active: false
      });

      return Response.json({
        success: true,
        vip: null
      });
    }

    const remainingMs = expiresAt - now;
    const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

    return Response.json({
      success: true,
      vip: {
        plan_key: subscription.plan_key,
        plan_name: subscription.plan_name,
        started_at: subscription.started_at,
        expires_at: subscription.expires_at,
        remaining_days: remainingDays
      }
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    }, { status: 500 });
  }
});