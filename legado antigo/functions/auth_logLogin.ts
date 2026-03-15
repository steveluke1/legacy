import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { user_id, username, result } = await req.json();

    if (!result || !['SUCCESS', 'FAILED'].includes(result)) {
      return Response.json({ error: 'Result inválido' }, { status: 400 });
    }

    // Get IP and user agent from headers
    const ip_address = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
    const user_agent = req.headers.get('user-agent') || 'unknown';

    await base44.asServiceRole.entities.LoginLog.create({
      user_id: user_id || null,
      username: username || null,
      ip_address,
      user_agent,
      result
    });

    return Response.json({ success: true });

  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});