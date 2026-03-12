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

    // Fetch user account using service role
    const accounts = await base44.asServiceRole.entities.UserAccount.filter(
      { user_id: user.id },
      undefined,
      1
    );

    const account = accounts.length > 0 ? accounts[0] : null;

    return Response.json({
      success: true,
      account
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    }, { status: 500 });
  }
});