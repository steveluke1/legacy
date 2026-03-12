import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { verifyAdminToken } from './_shared/authHelpers.js';

const SEED_ID = 'MEGA_SEED_V1000_V1';
const BATCH_SIZE = 200;

// Safe entities that should NEVER be deleted (auth, security, real billing)
const PROTECTED_ENTITIES = [
  'AdminUser',
  'AdminSession',
  'AuthUser',
  'AuthSession',
  'PasswordResetToken'
];

// Entities that store seed data (order matters - children first)
const SEEDABLE_ENTITIES = [
  'AnalyticsEvent',
  'CommerceEvent',
  'MarketplaceAuditLog',
  'AuthAuditLog',
  'AdminAuditLog',
  'LedgerEntry',
  'MarketplaceLedger',
  'WeeklyRankingPayout',
  'WeeklyRankingSnapshot',
  'AlzLock',
  'AlzOrder',
  'AlzListing',
  'SplitPayout',
  'PixCharge',
  'MarketListing',
  'MarketOrder',
  'AlzTrade',
  'AlzPixPayment',
  'AlzPaymentSplit',
  'AlzSellOrder',
  'ServiceContract',
  'ServiceContractLog',
  'ServiceOffer',
  'GameCharacter',
  'GameAccount',
  'Guild',
  'TGWarPlayerScore',
  'TGWarMatch',
  'TGWarEvent',
  'WeeklyTGKillRanking',
  'DGCompletion',
  'RankingEntry',
  'ServerStatsSnapshot',
  'Notification'
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin token
    try {
      await verifyAdminToken(req, base44);
    } catch (authError) {
      return Response.json({ 
        success: false,
        error: authError.message 
      }, { status: 401 });
    }
    
    console.log('[PURGE] Starting seed data purge...');
    
    const report = {
      deleted: {},
      errors: [],
      warnings: [],
      total_deleted: 0
    };
    
    // Purge each entity
    for (const entityName of SEEDABLE_ENTITIES) {
      try {
        console.log(`[PURGE] Processing ${entityName}...`);
        
        let deletedCount = 0;
        let hasMore = true;
        
        while (hasMore) {
          // Find seed records
          const records = await base44.asServiceRole.entities[entityName]
            .list('-created_date', BATCH_SIZE);
          
          if (!records || records.length === 0) {
            hasMore = false;
            break;
          }
          
          // Filter for seed records
          const seedRecords = records.filter(r => {
            return (
              r.seed_id === SEED_ID ||
              r.seed_id?.startsWith('DEMO_') ||
              r.seed_id?.startsWith('SEED_') ||
              r.metadata?.seed_id === SEED_ID ||
              r.metadata?.is_seed === true ||
              r.metadata?.is_demo === true ||
              r.is_seed === true ||
              r.created_by === 'seed'
            );
          });
          
          if (seedRecords.length === 0) {
            hasMore = false;
            break;
          }
          
          // Delete in batches
          for (const record of seedRecords) {
            try {
              await base44.asServiceRole.entities[entityName].delete(record.id);
              deletedCount++;
            } catch (deleteError) {
              console.error(`[PURGE] Error deleting ${entityName} ${record.id}:`, deleteError.message);
              report.errors.push({
                entity: entityName,
                id: record.id,
                error: deleteError.message
              });
            }
          }
          
          // Check if we should continue
          if (seedRecords.length < BATCH_SIZE) {
            hasMore = false;
          }
          
          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (deletedCount > 0) {
          report.deleted[entityName] = deletedCount;
          report.total_deleted += deletedCount;
          console.log(`[PURGE] Deleted ${deletedCount} records from ${entityName}`);
        }
        
      } catch (entityError) {
        console.error(`[PURGE] Error processing ${entityName}:`, entityError.message);
        report.errors.push({
          entity: entityName,
          error: entityError.message
        });
      }
    }
    
    // Add warnings for protected entities
    report.warnings.push(
      `Protected entities (never deleted): ${PROTECTED_ENTITIES.join(', ')}`
    );
    
    console.log('[PURGE] Purge complete:', report);
    
    return Response.json({
      success: true,
      message: 'Seed data purged successfully',
      report
    });
    
  } catch (error) {
    console.error('[PURGE] Fatal error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});