import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { releaseAlzToGame } from './_lib/gameIntegration.js';

/**
 * Cron job to release expired ALZ locks
 * Run daily to cleanup expired listings
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify cron secret (optional security)
    const cronSecret = Deno.env.get('CRON_SECRET');
    if (cronSecret) {
      const authHeader = req.headers.get('authorization');
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Find expired listings that are still active
    const listings = await base44.asServiceRole.entities.AlzListing.filter({
      status: 'active'
    });

    const expiredListings = listings.filter(listing => {
      const expiresAt = new Date(listing.expires_at);
      return expiresAt < now;
    });

    console.log(`Found ${expiredListings.length} expired listings`);

    const results = {
      processed: 0,
      released: 0,
      errors: []
    };

    for (const listing of expiredListings) {
      try {
        // Find associated lock
        const locks = await base44.asServiceRole.entities.AlzLock.filter({
          listing_id: listing.listing_id,
          status: 'locked'
        });

        if (locks.length === 0) {
          console.log(`No lock found for listing ${listing.listing_id}`);
          continue;
        }

        const lock = locks[0];

        // Release ALZ back to game
        const releaseResult = await releaseAlzToGame(
          lock.seller_character_name,
          lock.alz_amount
        );

        if (!releaseResult.success) {
          throw new Error(releaseResult.error || 'Failed to release ALZ');
        }

        const releaseTime = new Date().toISOString();

        // Update lock status
        await base44.asServiceRole.entities.AlzLock.update(lock.id, {
          status: 'released',
          released_at: releaseTime,
          release_reason: 'expired'
        });

        // Update listing status
        await base44.asServiceRole.entities.AlzListing.update(listing.id, {
          status: 'expired'
        });

        // Create ledger entry
        await base44.asServiceRole.entities.LedgerEntry.create({
          entry_id: `ledger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'ALZ_RELEASE',
          ref_id: listing.listing_id,
          actor: 'system',
          amount_alz: lock.alz_amount,
          metadata: {
            lock_id: lock.lock_id,
            character_name: lock.seller_character_name,
            reason: 'expired',
            expires_at: listing.expires_at
          },
          created_at: releaseTime
        });

        results.processed++;
        results.released++;

      } catch (error) {
        console.error(`Error releasing lock for listing ${listing.listing_id}:`, error);
        results.errors.push({
          listing_id: listing.listing_id,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      results,
      processed_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in market_releaseExpiredLocks:', error);
    return Response.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 });
  }
});