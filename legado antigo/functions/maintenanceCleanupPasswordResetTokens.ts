import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { constantTimeEquals } from './securityHelpers.js';

Deno.serve(async (req) => {
  const correlationId = crypto.randomUUID();
  
  try {
    console.log(`[maintenanceCleanupPasswordResetTokens:${correlationId}] START`);
    
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { maintenance_secret, dry_run } = body;

    // Validate maintenance secret
    const expectedSecret = Deno.env.get('MAINTENANCE_SECRET');
    
    if (!expectedSecret) {
      console.error(`[maintenanceCleanupPasswordResetTokens:${correlationId}] MAINTENANCE_SECRET not configured`);
      return Response.json({
        success: false,
        error: 'MAINTENANCE_SECRET não configurado no servidor.'
      }, { status: 500 });
    }

    if (!maintenance_secret || !constantTimeEquals(maintenance_secret, expectedSecret)) {
      console.warn(`[maintenanceCleanupPasswordResetTokens:${correlationId}] UNAUTHORIZED`);
      return Response.json({
        success: false,
        error: 'Não autorizado.'
      }, { status: 401 });
    }

    // Fetch all tokens
    const allTokens = await base44.asServiceRole.entities.PasswordResetToken.list('-created_date', 1000);
    
    const now = new Date();
    const toDelete = [];
    
    for (const token of allTokens) {
      // Delete if used OR expired
      if (token.used) {
        toDelete.push({ id: token.id, reason: 'used' });
      } else if (token.expires_at) {
        const expiresAt = new Date(token.expires_at);
        if (expiresAt < now) {
          toDelete.push({ id: token.id, reason: 'expired' });
        }
      }
    }

    console.log(`[maintenanceCleanupPasswordResetTokens:${correlationId}] FOUND_TO_DELETE count=${toDelete.length} dry_run=${!!dry_run}`);

    if (!dry_run) {
      // Actually delete
      for (const item of toDelete) {
        await base44.asServiceRole.entities.PasswordResetToken.delete(item.id);
      }
      console.log(`[maintenanceCleanupPasswordResetTokens:${correlationId}] DELETED count=${toDelete.length}`);
    }

    return Response.json({
      success: true,
      data: {
        dry_run: !!dry_run,
        total_tokens: allTokens.length,
        tokens_to_delete: toDelete.length,
        deleted: dry_run ? 0 : toDelete.length,
        breakdown: {
          used: toDelete.filter(t => t.reason === 'used').length,
          expired: toDelete.filter(t => t.reason === 'expired').length
        }
      }
    });

  } catch (error) {
    console.error(`[maintenanceCleanupPasswordResetTokens:${correlationId}] FATAL_ERROR:`, error);
    return Response.json({
      success: false,
      error: 'Erro ao processar manutenção.'
    }, { status: 500 });
  }
});