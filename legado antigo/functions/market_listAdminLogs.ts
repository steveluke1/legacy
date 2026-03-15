import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return Response.json({ success: false, error: 'Acesso negado. Apenas administradores.' }, { status: 403 });
    }

    const body = await req.json();
    const { limit = 100, action_filter, user_id_filter } = body;

    let filters = {};
    if (action_filter) filters.action = action_filter;
    if (user_id_filter) filters.user_id = user_id_filter;

    const logs = await base44.entities.MarketAuditLog.filter(
      filters,
      '-created_date',
      limit
    );

    return Response.json({ success: true, logs });
  } catch (error) {
    console.error('Error listing admin logs:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});