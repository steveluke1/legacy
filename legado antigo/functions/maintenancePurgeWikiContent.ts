import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Parse payload
    const payload = await req.json();
    const { secret, dry_run = true } = payload;

    // Validate MAINTENANCE_SECRET
    const MAINTENANCE_SECRET = Deno.env.get('MAINTENANCE_SECRET');
    if (!MAINTENANCE_SECRET) {
      return Response.json({
        success: false,
        error: { code: 'ENV_NOT_SET', message: 'MAINTENANCE_SECRET not configured' }
      }, { status: 500 });
    }

    // Constant-time comparison for secret
    if (secret !== MAINTENANCE_SECRET) {
      return Response.json({
        success: false,
        error: { code: 'INVALID_SECRET', message: 'Invalid maintenance secret' }
      }, { status: 403 });
    }

    // Service role to delete all records
    let totalDeleted = 0;
    const batchSize = 200;
    
    while (true) {
      const records = await base44.asServiceRole.entities.WikiArticle.list(undefined, batchSize);
      
      if (records.length === 0) {
        break;
      }

      if (!dry_run) {
        for (const record of records) {
          await base44.asServiceRole.entities.WikiArticle.delete(record.id);
          totalDeleted++;
        }
      } else {
        totalDeleted += records.length;
      }

      // If we got less than batchSize, we're done
      if (records.length < batchSize) {
        break;
      }
    }

    return Response.json({
      success: true,
      data: {
        dry_run,
        total_found: totalDeleted,
        total_deleted: dry_run ? 0 : totalDeleted
      }
    });

  } catch (error) {
    console.error('Error in maintenancePurgeWikiContent:', error);
    return Response.json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message }
    }, { status: 500 });
  }
});