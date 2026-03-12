import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Get admin audit logs (admin-only, secure)
 * AdminAuditLog is CRITICAL and must not be accessed directly from frontend
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // SECURITY: Verify admin authentication
    const currentUser = await base44.auth.me();
    
    if (!currentUser) {
      return Response.json({
        success: false,
        error: 'Você precisa estar logado como administrador'
      }, { status: 401 });
    }

    if (currentUser.role !== 'admin') {
      return Response.json({
        success: false,
        error: 'Acesso negado. Apenas administradores podem acessar logs de auditoria.'
      }, { status: 403 });
    }

    const { limit = 100, action } = await req.json();

    // SECURITY: Use service role to access CRITICAL entity AdminAuditLog
    let logs = await base44.asServiceRole.entities.AdminAuditLog.list('-created_date', limit);

    // Filter by action if provided
    if (action && action !== 'all') {
      logs = logs.filter(log => log.action === action);
    }

    return Response.json({
      success: true,
      logs,
      correlationId: `admin_audit_logs_${currentUser.id}_${Date.now()}`
    });

  } catch (error) {
    console.error('[admin_getAuditLogs] ERROR:', error);
    
    return Response.json({
      success: false,
      error: error.message,
      correlationId: `error_${Date.now()}`
    }, { status: 500 });
  }
});