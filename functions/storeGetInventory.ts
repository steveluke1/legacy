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

    const inventory = await base44.asServiceRole.entities.GiftCardInventory.filter({
      user_id: user.id
    });

    const inventoryMap = {};
    inventory.forEach(item => {
      inventoryMap[item.tier] = item.quantity;
    });

    return Response.json({
      success: true,
      inventory: inventoryMap
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    }, { status: 500 });
  }
});