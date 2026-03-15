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
    
    // Process DGCompletion
    const allDgCompletions = await base44.asServiceRole.entities.DGCompletion.list(undefined, 5000);
    const fakeDgCompletions = allDgCompletions.filter(dg =>
      dg.is_real !== true && dg.source !== 'GAME_SERVER'
    );
    
    // Process TGWarPlayerScore
    const allTgScores = await base44.asServiceRole.entities.TGWarPlayerScore.list(undefined, 5000);
    const fakeTgScores = allTgScores.filter(score =>
      score.is_real !== true && score.source !== 'GAME_SERVER'
    );
    
    if (dry_run) {
      return Response.json({
        success: true,
        dry_run: true,
        message: `Dry run: encontrados registros fake/seed para exclusão`,
        dgCompletion: {
          total: allDgCompletions.length,
          would_delete: fakeDgCompletions.length,
          would_keep_real: allDgCompletions.length - fakeDgCompletions.length
        },
        tgWarPlayerScore: {
          total: allTgScores.length,
          would_delete: fakeTgScores.length,
          would_keep_real: allTgScores.length - fakeTgScores.length
        }
      });
    }
    
    // Delete fake DGCompletion records in batches
    let dgDeleted = 0;
    for (let i = 0; i < fakeDgCompletions.length; i += 200) {
      const batch = fakeDgCompletions.slice(i, i + 200);
      for (const record of batch) {
        await base44.asServiceRole.entities.DGCompletion.delete(record.id);
        dgDeleted++;
      }
    }
    
    // Delete fake TGWarPlayerScore records in batches
    let tgDeleted = 0;
    for (let i = 0; i < fakeTgScores.length; i += 200) {
      const batch = fakeTgScores.slice(i, i + 200);
      for (const record of batch) {
        await base44.asServiceRole.entities.TGWarPlayerScore.delete(record.id);
        tgDeleted++;
      }
    }
    
    console.log(`[maintenancePurgeSeedRankings] Deleted ${dgDeleted} DG + ${tgDeleted} TG fake records`);
    
    return Response.json({
      success: true,
      message: `Purga concluída: ${dgDeleted} DGCompletion + ${tgDeleted} TGWarPlayerScore fake/seed excluídos`,
      data: {
        dgCompletion: {
          scanned: allDgCompletions.length,
          deleted: dgDeleted,
          real_remaining: allDgCompletions.length - dgDeleted
        },
        tgWarPlayerScore: {
          scanned: allTgScores.length,
          deleted: tgDeleted,
          real_remaining: allTgScores.length - tgDeleted
        }
      }
    });
    
  } catch (error) {
    console.error('[maintenancePurgeSeedRankings] Error:', error);
    return Response.json({ 
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    }, { status: 500 });
  }
});