import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get maintenance secret from environment
    const maintenanceSecret = Deno.env.get('MAINTENANCE_SECRET');
    
    if (!maintenanceSecret) {
      return Response.json({
        success: false,
        error: {
          code: 'CONFIG_ERROR',
          message: 'MAINTENANCE_SECRET não configurado. Configure este secret no painel Base44 antes de usar esta função.'
        }
      }, { status: 500 });
    }
    
    // Parse request body
    const body = await req.json();
    const { maintenance_secret, dry_run = false } = body;
    
    // Validate secret
    if (!maintenance_secret || maintenance_secret !== maintenanceSecret) {
      return Response.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Não autorizado. Secret inválido ou ausente.'
        }
      }, { status: 401 });
    }
    
    // Get all ServerStats records
    const allStats = await base44.asServiceRole.entities.ServerStats.list(undefined, 1000);
    
    // Filter fake/seed records (NOT real game server data)
    const fakeStats = allStats.filter(stat => 
      stat.is_real !== true && stat.source !== 'GAME_SERVER'
    );
    
    if (dry_run) {
      return Response.json({
        success: true,
        dry_run: true,
        message: `Dry run: encontrados ${fakeStats.length} registros fake/seed para exclusão`,
        would_delete: fakeStats.length,
        real_records: allStats.length - fakeStats.length
      });
    }
    
    // Delete all fake records
    let deletedCount = 0;
    for (const stat of fakeStats) {
      await base44.asServiceRole.entities.ServerStats.delete(stat.id);
      deletedCount++;
    }
    
    console.log(`[maintenancePurgeServerStats] Deleted ${deletedCount} fake/seed ServerStats records`);
    
    return Response.json({
      success: true,
      message: `Purga concluída com sucesso: ${deletedCount} registros fake/seed excluídos`,
      deleted_count: deletedCount,
      real_records_remaining: allStats.length - deletedCount
    });
    
  } catch (error) {
    console.error('[maintenancePurgeServerStats] Error:', error);
    return Response.json({ 
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    }, { status: 500 });
  }
});