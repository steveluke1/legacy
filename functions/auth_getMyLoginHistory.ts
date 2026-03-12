import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Get last 5 login attempts
    const logs = await base44.asServiceRole.entities.LoginLog.filter({
      user_id: user.id
    });

    // Sort by created_date descending and take first 5
    const sortedLogs = logs
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
      .slice(0, 5);

    return Response.json({ 
      success: true, 
      logs: sortedLogs 
    });

  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});