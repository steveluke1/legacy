import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { verifyAdminToken } from './_shared/authHelpers.js';
import { 
  SeededRandom, 
  GUILD_NAMES, 
  NATIONS, 
  generatePlayerName,
  generateTimestampInLast7Days,
  hashString,
  batchCreate
} from './_lib/seedHelpers.js';
import {
  generateMockCorredores,
  generateMockMatador,
  getCurrentWeekKey,
  getWeekDates,
  formatBRL,
  formatCASH
} from './_lib/mockRankingGenerator.js';

const SEED_ID = 'MEGA_SEED_V1000_V1';
const BASE_SEED = hashString(SEED_ID);

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
    
    console.log('[SEED] Starting MEGA seed generation...');
    
    const now = Date.now();
    const rng = new SeededRandom(BASE_SEED);
    const report = {
      created: {},
      errors: [],
      total_created: 0
    };
    
    // ============================================================
    // 1. SERVER STATS SNAPSHOT (1000 players online, 40 guilds)
    // ============================================================
    console.log('[SEED] Creating server stats...');
    
    const serverStats = await base44.asServiceRole.entities.ServerStatsSnapshot.create({
      snapshot_id: 'current',
      players_online: 1000,
      active_guilds: 40,
      tg_battles_24h: 24,
      dungeons_completed_24h: 1800,
      updated_at: new Date().toISOString(),
      seed_id: SEED_ID
    });
    
    report.created['ServerStatsSnapshot'] = 1;
    report.total_created += 1;
    
    // ============================================================
    // 2. GUILDS (40 guilds)
    // ============================================================
    console.log('[SEED] Creating 40 guilds...');
    
    const shuffledGuildNames = rng.shuffle(GUILD_NAMES).slice(0, 40);
    const guilds = [];
    
    for (let i = 0; i < 40; i++) {
      const guild = {
        name: shuffledGuildNames[i],
        nation: rng.choice(NATIONS),
        members_count: rng.nextInt(15, 45),
        level: rng.nextInt(1, 10),
        weekly_points: rng.nextInt(5000, 50000),
        created_at: generateTimestampInLast7Days(rng, now),
        seed_id: SEED_ID,
        metadata: { seed_id: SEED_ID, is_seed: true }
      };
      
      try {
        const created = await base44.asServiceRole.entities.Guild.create(guild);
        guilds.push(created);
      } catch (err) {
        console.error('[SEED] Error creating guild:', err.message);
        report.errors.push({ entity: 'Guild', error: err.message });
      }
    }
    
    report.created['Guild'] = guilds.length;
    report.total_created += guilds.length;
    
    // ============================================================
    // 3. RANKINGS (Corredores + Matador + Hall da Fama)
    // ============================================================
    console.log('[SEED] Creating ranking snapshots...');
    
    const timezone = 'America/Sao_Paulo';
    const weekKey = getCurrentWeekKey(timezone);
    const dates = getWeekDates(weekKey, timezone);
    const generatedAt = new Date().toISOString();
    
    // Generate Corredores (top 50)
    const corredoresData = generateMockCorredores(weekKey, BASE_SEED, 50).map(player => ({
      ...player,
      seed_id: SEED_ID,
      guild: guilds[rng.nextInt(0, guilds.length - 1)]?.name || player.guild
    }));
    
    const corredoresSnapshot = await base44.asServiceRole.entities.WeeklyRankingSnapshot.create({
      week_key: weekKey,
      period_start: dates.start,
      period_end: dates.end,
      type: 'CORREDORES',
      status: 'open',
      prizes: [
        { place: 1, currency: 'BRL', value: 500.00, display: formatBRL(500.00) },
        { place: 2, currency: 'BRL', value: 250.00, display: formatBRL(250.00) },
        { place: 3, currency: 'BRL', value: 100.00, display: formatBRL(100.00) },
        { place: 4, currency: 'BRL', value: 50.00, display: formatBRL(50.00) },
        { place: 5, currency: 'BRL', value: 25.00, display: formatBRL(25.00) }
      ],
      results: corredoresData,
      generated_at: generatedAt,
      generated_by: 'seed',
      version: 1,
      seed_id: SEED_ID
    });
    
    // Generate Matador (top 50)
    const matadorData = generateMockMatador(weekKey, BASE_SEED + 1000, 50).map(player => ({
      ...player,
      seed_id: SEED_ID,
      guild: guilds[rng.nextInt(0, guilds.length - 1)]?.name || player.guild
    }));
    
    const matadorSnapshot = await base44.asServiceRole.entities.WeeklyRankingSnapshot.create({
      week_key: weekKey,
      period_start: dates.start,
      period_end: dates.end,
      type: 'MATADOR',
      status: 'open',
      prizes: [
        { place: 1, currency: 'CASH', value: 10000, display: formatCASH(10000) },
        { place: 2, currency: 'CASH', value: 5000, display: formatCASH(5000) },
        { place: 3, currency: 'CASH', value: 1500, display: formatCASH(1500) },
        { place: 4, currency: 'CASH', value: 1000, display: formatCASH(1000) },
        { place: 5, currency: 'CASH', value: 500, display: formatCASH(500) }
      ],
      results: matadorData,
      generated_at: generatedAt,
      generated_by: 'seed',
      version: 1,
      seed_id: SEED_ID
    });
    
    // Hall da Fama
    const hallSnapshot = await base44.asServiceRole.entities.WeeklyRankingSnapshot.create({
      week_key: weekKey,
      period_start: dates.start,
      period_end: dates.end,
      type: 'HALL_DA_FAMA',
      status: 'open',
      prizes: [],
      results: [
        {
          category: 'Corredor da Semana',
          top: corredoresData.slice(0, 3)
        },
        {
          category: 'Matador da Semana',
          top: matadorData.slice(0, 3)
        }
      ],
      generated_at: generatedAt,
      generated_by: 'seed',
      version: 1,
      seed_id: SEED_ID
    });
    
    report.created['WeeklyRankingSnapshot'] = 3;
    report.total_created += 3;
    
    // ============================================================
    // 4. ALZ MARKET (300 sell orders + 300 buy orders + 200 trades)
    // ============================================================
    console.log('[SEED] Creating ALZ market data...');
    
    // Sell orders (listings)
    const listings = [];
    for (let i = 0; i < 300; i++) {
      const sellerName = generatePlayerName(rng);
      const alzAmount = rng.nextInt(50000, 5000000);
      const priceBrl = alzAmount * 0.00012 * (0.9 + rng.next() * 0.2); // ~0.00012 BRL per ALZ ±10%
      
      listings.push({
        listing_id: `SEED_LISTING_${i}`,
        seller_user_id: `seed_user_${i}`,
        seller_character_name: sellerName,
        alz_amount: alzAmount,
        price_brl: parseFloat(priceBrl.toFixed(2)),
        status: 'active',
        created_at: generateTimestampInLast7Days(rng, now),
        expires_at: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(),
        seed_id: SEED_ID,
        notes: { seed_id: SEED_ID, is_seed: true }
      });
    }
    
    const createdListings = await batchCreate(base44, 'AlzListing', listings, 100);
    report.created['AlzListing'] = createdListings.length;
    report.total_created += createdListings.length;
    
    // Orders (mix of completed and pending)
    const orders = [];
    for (let i = 0; i < 500; i++) {
      const buyerName = generatePlayerName(rng);
      const alzAmount = rng.nextInt(50000, 2000000);
      const priceBrl = alzAmount * 0.00012 * (0.9 + rng.next() * 0.2);
      const isCompleted = i < 200; // First 200 are completed (trades)
      
      orders.push({
        order_id: `SEED_ORDER_${i}`,
        listing_id: `SEED_LISTING_${rng.nextInt(0, 299)}`,
        seller_user_id: `seed_seller_${rng.nextInt(0, 299)}`,
        buyer_user_id: `seed_buyer_${i}`,
        buyer_email: `buyer${i}@seed.test`,
        character_nick: buyerName,
        alz_amount: alzAmount,
        price_brl: parseFloat(priceBrl.toFixed(2)),
        market_fee_percent: 1.5,
        market_fee_brl: parseFloat((priceBrl * 0.015).toFixed(2)),
        seller_net_brl: parseFloat((priceBrl * 0.985).toFixed(2)),
        status: isCompleted ? 'delivered' : rng.choice(['pending_payment', 'awaiting_pix', 'paid']),
        created_at: generateTimestampInLast7Days(rng, now),
        delivered_at: isCompleted ? generateTimestampInLast7Days(rng, now) : null,
        seed_id: SEED_ID,
        notes: { seed_id: SEED_ID, is_seed: true }
      });
    }
    
    const createdOrders = await batchCreate(base44, 'AlzOrder', orders, 100);
    report.created['AlzOrder'] = createdOrders.length;
    report.total_created += createdOrders.length;
    
    // ============================================================
    // 5. ANALYTICS EVENTS (for admin dashboards)
    // ============================================================
    console.log('[SEED] Creating analytics events...');
    
    const analyticsEvents = [];
    
    // Page views (20,000 over 7 days)
    for (let i = 0; i < 20000; i++) {
      analyticsEvents.push({
        event_type: 'page_view',
        event_name: 'Page View',
        path: rng.choice(['/Home', '/RankingCorredores', '/RankingMatadorSemanal', '/Mercado', '/Guildas', '/Wiki']),
        role_context: rng.choice(['public', 'user', 'user', 'user']),
        session_id: `seed_session_${rng.nextInt(1, 5000)}`,
        anon_id: `seed_anon_${rng.nextInt(1, 3000)}`,
        day_key: new Date(generateTimestampInLast7Days(rng, now)).toISOString().split('T')[0],
        dedupe_key: `seed_page_${i}`,
        metadata: { seed_id: SEED_ID, is_seed: true }
      });
    }
    
    // Funnel events
    for (let i = 0; i < 2500; i++) {
      analyticsEvents.push({
        event_type: 'signup_view',
        event_name: 'Signup View',
        path: '/Registrar',
        role_context: 'public',
        session_id: `seed_session_signup_${i}`,
        anon_id: `seed_anon_${rng.nextInt(1, 2500)}`,
        day_key: new Date(generateTimestampInLast7Days(rng, now)).toISOString().split('T')[0],
        dedupe_key: `seed_signup_view_${i}`,
        metadata: { seed_id: SEED_ID, is_seed: true }
      });
    }
    
    for (let i = 0; i < 1200; i++) {
      analyticsEvents.push({
        event_type: 'signup_complete',
        event_name: 'Signup Complete',
        path: '/Registrar',
        role_context: 'public',
        session_id: `seed_session_signup_${i}`,
        anon_id: `seed_anon_${rng.nextInt(1, 1200)}`,
        day_key: new Date(generateTimestampInLast7Days(rng, now)).toISOString().split('T')[0],
        dedupe_key: `seed_signup_complete_${i}`,
        metadata: { seed_id: SEED_ID, is_seed: true, username: `SeedUser${i}` }
      });
    }
    
    const createdAnalytics = await batchCreate(base44, 'AnalyticsEvent', analyticsEvents, 200);
    report.created['AnalyticsEvent'] = createdAnalytics.length;
    report.total_created += createdAnalytics.length;
    
    // ============================================================
    // 6. COMMERCE EVENTS (for market admin logs)
    // ============================================================
    console.log('[SEED] Creating commerce events...');
    
    const commerceEvents = [];
    
    for (let i = 0; i < 200; i++) {
      commerceEvents.push({
        eventType: 'ALZ_ORDER_COMPLETED',
        actorAccountId: `seed_account_${i}`,
        productCategory: 'ALZ',
        currency: 'BRL',
        amount: orders[i]?.price_brl || 50,
        amountBrl: orders[i]?.price_brl || 50,
        amountAlz: orders[i]?.alz_amount || 100000,
        feeBrl: (orders[i]?.price_brl || 50) * 0.015,
        netBrl: (orders[i]?.price_brl || 50) * 0.985,
        orderId: `SEED_ORDER_${i}`,
        correlationId: `seed_commerce_${i}`,
        metadata: { seed_id: SEED_ID, is_seed: true }
      });
    }
    
    const createdCommerce = await batchCreate(base44, 'CommerceEvent', commerceEvents, 100);
    report.created['CommerceEvent'] = createdCommerce.length;
    report.total_created += createdCommerce.length;
    
    // ============================================================
    // FINAL REPORT
    // ============================================================
    
    console.log('[SEED] Mega seed complete:', report);
    
    return Response.json({
      success: true,
      message: 'Mega seed generated successfully',
      seed_id: SEED_ID,
      report,
      summary: {
        players_online: 1000,
        active_guilds: 40,
        guilds_created: guilds.length,
        ranking_snapshots: 3,
        alz_listings: createdListings.length,
        alz_orders: createdOrders.length,
        analytics_events: createdAnalytics.length,
        commerce_events: createdCommerce.length,
        total_records: report.total_created
      }
    });
    
  } catch (error) {
    console.error('[SEED] Fatal error:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});