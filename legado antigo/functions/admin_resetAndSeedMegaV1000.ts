import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const SEED_ID = 'MEGA_SEED_V1000_V1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log('[RESET] Starting reset and seed process...');
    
    const startedAt = new Date().toISOString();
    
    // Create SeedRun record
    let seedRun;
    try {
      seedRun = await base44.asServiceRole.entities.SeedRun.create({
        seed_id: SEED_ID,
        status: 'running',
        started_at: startedAt,
        created_by_admin_id: user.id
      });
    } catch (err) {
      console.error('[RESET] Error creating SeedRun:', err);
      return Response.json({ 
        error: 'Failed to create SeedRun record',
        details: err.message 
      }, { status: 500 });
    }
    
    let purgeReport, seedReport, validationReport;
    
    try {
      // ============================================================
      // STEP 1: PURGE
      // ============================================================
      console.log('[RESET] Step 1: Purging existing seed data...');
      
      const purgeResponse = await base44.functions.invoke('admin_purgeSeedData');
      
      if (!purgeResponse.data?.success) {
        throw new Error(`Purge failed: ${purgeResponse.data?.error || 'Unknown error'}`);
      }
      
      purgeReport = purgeResponse.data.report;
      console.log('[RESET] Purge complete:', purgeReport);
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // ============================================================
      // STEP 2: SEED
      // ============================================================
      console.log('[RESET] Step 2: Generating mega seed...');
      
      const seedResponse = await base44.functions.invoke('admin_seedMegaV1000');
      
      if (!seedResponse.data?.success) {
        throw new Error(`Seed failed: ${seedResponse.data?.error || 'Unknown error'}`);
      }
      
      seedReport = seedResponse.data;
      console.log('[RESET] Seed complete:', seedReport);
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // ============================================================
      // STEP 3: VALIDATION
      // ============================================================
      console.log('[RESET] Step 3: Running validation...');
      
      validationReport = {
        checks: [],
        passed: 0,
        failed: 0,
        warnings: []
      };
      
      // Check server stats
      try {
        const stats = await base44.asServiceRole.entities.ServerStatsSnapshot.filter({
          snapshot_id: 'current'
        });
        
        const currentStats = stats[0];
        
        if (currentStats?.players_online === 1000) {
          validationReport.checks.push({ name: 'Players Online', status: 'PASS', value: 1000 });
          validationReport.passed++;
        } else {
          validationReport.checks.push({ 
            name: 'Players Online', 
            status: 'FAIL', 
            expected: 1000, 
            actual: currentStats?.players_online 
          });
          validationReport.failed++;
        }
        
        if (currentStats?.active_guilds === 40) {
          validationReport.checks.push({ name: 'Active Guilds', status: 'PASS', value: 40 });
          validationReport.passed++;
        } else {
          validationReport.checks.push({ 
            name: 'Active Guilds', 
            status: 'FAIL', 
            expected: 40, 
            actual: currentStats?.active_guilds 
          });
          validationReport.failed++;
        }
      } catch (err) {
        validationReport.checks.push({ 
          name: 'Server Stats', 
          status: 'FAIL', 
          error: err.message 
        });
        validationReport.failed++;
      }
      
      // Check rankings consistency
      try {
        const rankingsResponse = await base44.functions.invoke('rankings_getCurrent');
        const rankingsData = rankingsResponse.data;
        
        if (rankingsData?.corredores?.top3?.length === 3) {
          validationReport.checks.push({ 
            name: 'Corredores Top 3', 
            status: 'PASS', 
            value: rankingsData.corredores.top3.map(p => p.character_name).join(', ')
          });
          validationReport.passed++;
        } else {
          validationReport.checks.push({ 
            name: 'Corredores Top 3', 
            status: 'FAIL' 
          });
          validationReport.failed++;
        }
        
        if (rankingsData?.matador?.top3?.length === 3) {
          validationReport.checks.push({ 
            name: 'Matador Top 3', 
            status: 'PASS', 
            value: rankingsData.matador.top3.map(p => p.character_name).join(', ')
          });
          validationReport.passed++;
        } else {
          validationReport.checks.push({ 
            name: 'Matador Top 3', 
            status: 'FAIL' 
          });
          validationReport.failed++;
        }
      } catch (err) {
        validationReport.checks.push({ 
          name: 'Rankings', 
          status: 'FAIL', 
          error: err.message 
        });
        validationReport.failed++;
      }
      
      // Check market data
      try {
        const listings = await base44.asServiceRole.entities.AlzListing.filter({ seed_id: SEED_ID });
        const orders = await base44.asServiceRole.entities.AlzOrder.filter({ seed_id: SEED_ID });
        
        if (listings.length >= 300) {
          validationReport.checks.push({ 
            name: 'ALZ Listings', 
            status: 'PASS', 
            value: listings.length 
          });
          validationReport.passed++;
        } else {
          validationReport.checks.push({ 
            name: 'ALZ Listings', 
            status: 'FAIL', 
            expected: '≥300', 
            actual: listings.length 
          });
          validationReport.failed++;
        }
        
        if (orders.length >= 500) {
          validationReport.checks.push({ 
            name: 'ALZ Orders', 
            status: 'PASS', 
            value: orders.length 
          });
          validationReport.passed++;
        } else {
          validationReport.checks.push({ 
            name: 'ALZ Orders', 
            status: 'FAIL', 
            expected: '≥500', 
            actual: orders.length 
          });
          validationReport.failed++;
        }
      } catch (err) {
        validationReport.checks.push({ 
          name: 'Market Data', 
          status: 'FAIL', 
          error: err.message 
        });
        validationReport.failed++;
      }
      
      // Check guilds
      try {
        const guilds = await base44.asServiceRole.entities.Guild.filter({ seed_id: SEED_ID });
        
        if (guilds.length === 40) {
          validationReport.checks.push({ 
            name: 'Guilds', 
            status: 'PASS', 
            value: 40 
          });
          validationReport.passed++;
        } else {
          validationReport.checks.push({ 
            name: 'Guilds', 
            status: 'FAIL', 
            expected: 40, 
            actual: guilds.length 
          });
          validationReport.failed++;
        }
      } catch (err) {
        validationReport.checks.push({ 
          name: 'Guilds', 
          status: 'FAIL', 
          error: err.message 
        });
        validationReport.failed++;
      }
      
      // Update SeedRun with success
      const completedAt = new Date().toISOString();
      await base44.asServiceRole.entities.SeedRun.update(seedRun.id, {
        status: 'done',
        completed_at: completedAt,
        purge_report: purgeReport,
        seed_report: seedReport.report,
        validation_report: validationReport,
        totals: {
          purged: purgeReport.total_deleted,
          created: seedReport.report.total_created,
          validation_passed: validationReport.passed,
          validation_failed: validationReport.failed
        }
      });
      
      console.log('[RESET] Reset and seed complete!');
      
      return Response.json({
        success: true,
        message: 'Reset and seed completed successfully',
        seed_id: SEED_ID,
        seed_run_id: seedRun.id,
        started_at: startedAt,
        completed_at: completedAt,
        purge_report: purgeReport,
        seed_report: seedReport,
        validation_report: validationReport,
        summary: {
          purged_records: purgeReport.total_deleted,
          created_records: seedReport.report.total_created,
          validations_passed: validationReport.passed,
          validations_failed: validationReport.failed,
          overall_status: validationReport.failed === 0 ? 'SUCCESS' : 'PARTIAL SUCCESS'
        }
      });
      
    } catch (error) {
      console.error('[RESET] Error during reset:', error);
      
      // Update SeedRun with failure
      try {
        await base44.asServiceRole.entities.SeedRun.update(seedRun.id, {
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: error.message,
          purge_report: purgeReport || null,
          seed_report: seedReport?.report || null,
          validation_report: validationReport || null
        });
      } catch (updateErr) {
        console.error('[RESET] Failed to update SeedRun:', updateErr);
      }
      
      return Response.json({ 
        success: false,
        error: error.message,
        purge_report: purgeReport,
        seed_report: seedReport,
        validation_report: validationReport
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('[RESET] Fatal error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});