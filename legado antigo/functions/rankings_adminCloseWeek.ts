import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { 
  generateMockCorredores, 
  generateMockMatador,
  getCurrentWeekKey,
  getWeekDates,
  formatBRL,
  formatCASH
} from './_lib/mockRankingGenerator.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ 
        error: 'Unauthorized' 
      }, { status: 401 });
    }
    
    const { week_key: requestedWeekKey } = await req.json().catch(() => ({}));
    
    // Get config
    let config = await base44.asServiceRole.entities.RankingConfig.filter({ id: 'global' });
    if (!config || config.length === 0) {
      return Response.json({ 
        error: 'RankingConfig not found' 
      }, { status: 500 });
    }
    config = config[0];
    
    // Determine week to close (previous week by default)
    const currentWeekKey = getCurrentWeekKey(config.timezone);
    const weekToClose = requestedWeekKey || getPreviousWeekKey(currentWeekKey);
    const dates = getWeekDates(weekToClose, config.timezone);
    
    // Check if already closed (idempotency)
    const existing = await base44.asServiceRole.entities.WeeklyRankingSnapshot.filter({
      week_key: weekToClose
    });
    
    if (existing.length > 0) {
      return Response.json({
        message: 'Week already closed',
        week_key: weekToClose,
        snapshots: existing
      });
    }
    
    const now = new Date().toISOString();
    const generatedBy = 'admin';
    
    // Generate mock data
    const corredoresData = generateMockCorredores(weekToClose, config.seed, config.top_n);
    const matadorData = generateMockMatador(weekToClose, config.seed, config.top_n);
    
    // Prizes config
    const corredoresPrizesConfig = config.corredores_prizes || [
      { place: 1, value: 500.00 },
      { place: 2, value: 250.00 },
      { place: 3, value: 100.00 },
      { place: 4, value: 50.00 },
      { place: 5, value: 25.00 }
    ];
    
    const matadorPrizesConfig = config.matador_prizes || [
      { place: 1, value: 10000 },
      { place: 2, value: 5000 },
      { place: 3, value: 1500 },
      { place: 4, value: 1000 },
      { place: 5, value: 500 }
    ];
    
    // Create CORREDORES snapshot
    const corredoresSnapshot = await base44.asServiceRole.entities.WeeklyRankingSnapshot.create({
      week_key: weekToClose,
      period_start: dates.start,
      period_end: dates.end,
      type: 'CORREDORES',
      status: 'closed',
      prizes: corredoresPrizesConfig.map(p => ({
        place: p.place,
        currency: 'BRL',
        value: p.value,
        display: formatBRL(p.value)
      })),
      results: corredoresData,
      generated_at: now,
      generated_by: generatedBy,
      version: 1
    });
    
    // Create MATADOR snapshot
    const matadorSnapshot = await base44.asServiceRole.entities.WeeklyRankingSnapshot.create({
      week_key: weekToClose,
      period_start: dates.start,
      period_end: dates.end,
      type: 'MATADOR',
      status: 'closed',
      prizes: matadorPrizesConfig.map(p => ({
        place: p.place,
        currency: 'CASH',
        value: p.value,
        display: formatCASH(p.value)
      })),
      results: matadorData,
      generated_at: now,
      generated_by: generatedBy,
      version: 1
    });
    
    // Create HALL_DA_FAMA snapshot
    const hallSnapshot = await base44.asServiceRole.entities.WeeklyRankingSnapshot.create({
      week_key: weekToClose,
      period_start: dates.start,
      period_end: dates.end,
      type: 'HALL_DA_FAMA',
      status: 'closed',
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
      generated_at: now,
      generated_by: generatedBy,
      version: 1
    });
    
    // Create payout records for CORREDORES
    const corredoresPayouts = [];
    for (const prize of corredoresPrizesConfig.slice(0, 5)) {
      const player = corredoresData[prize.place - 1];
      if (player) {
        const payout = await base44.asServiceRole.entities.WeeklyRankingPayout.create({
          week_key: weekToClose,
          snapshot_id: corredoresSnapshot.id,
          ranking_type: 'CORREDORES',
          place: prize.place,
          nickname: player.nickname,
          user_ref: null,
          currency: 'BRL',
          amount: prize.value,
          display_amount: formatBRL(prize.value),
          payout_status: 'pending'
        });
        corredoresPayouts.push(payout);
      }
    }
    
    // Create payout records for MATADOR
    const matadorPayouts = [];
    for (const prize of matadorPrizesConfig.slice(0, 5)) {
      const player = matadorData[prize.place - 1];
      if (player) {
        const payout = await base44.asServiceRole.entities.WeeklyRankingPayout.create({
          week_key: weekToClose,
          snapshot_id: matadorSnapshot.id,
          ranking_type: 'MATADOR',
          place: prize.place,
          nickname: player.nickname,
          user_ref: null,
          currency: 'CASH',
          amount: prize.value,
          display_amount: formatCASH(prize.value),
          payout_status: 'pending'
        });
        matadorPayouts.push(payout);
      }
    }
    
    return Response.json({
      success: true,
      message: 'Week closed successfully',
      week_key: weekToClose,
      snapshots: [corredoresSnapshot, matadorSnapshot, hallSnapshot],
      payouts: [...corredoresPayouts, ...matadorPayouts]
    });
    
  } catch (error) {
    console.error('[rankings_adminCloseWeek] Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});

function getPreviousWeekKey(currentWeekKey) {
  const [year, week] = currentWeekKey.split('-W').map(Number);
  const prevWeek = week - 1;
  
  if (prevWeek < 1) {
    return `${year - 1}-W52`;
  }
  
  return `${year}-W${String(prevWeek).padStart(2, '0')}`;
}