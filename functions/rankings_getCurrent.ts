import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { 
  generateMockCorredores, 
  generateMockMatador,
  getCurrentWeekKey,
  getWeekDates,
  formatPeriodLabel,
  formatBRL,
  formatCASH
} from './_lib/mockRankingGenerator.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get config
    let config = await base44.asServiceRole.entities.RankingConfig.filter({ id: 'global' });
    if (!config || config.length === 0) {
      // Create default config
      config = await base44.asServiceRole.entities.RankingConfig.create({
        id: 'global',
        timezone: 'America/Sao_Paulo',
        use_mock_data: true,
        seed: 42
      });
    } else {
      config = config[0];
    }
    
    const weekKey = getCurrentWeekKey(config.timezone);
    const dates = getWeekDates(weekKey, config.timezone);
    const periodLabel = formatPeriodLabel(dates.start, dates.end);
    
    // Generate mock data
    const corredoresData = generateMockCorredores(weekKey, config.seed, config.top_n);
    const matadorData = generateMockMatador(weekKey, config.seed, config.top_n);
    
    // Format prizes
    const corredoresPrizes = [
      { place: 1, color: '#FFD700', value: formatBRL(500.00) },
      { place: 2, color: '#C0C0C0', value: formatBRL(250.00) },
      { place: 3, color: '#CD7F32', value: formatBRL(100.00) },
      { place: 4, color: '#A9B2C7', value: formatBRL(50.00) },
      { place: 5, color: '#A9B2C7', value: formatBRL(25.00) }
    ];
    
    const matadorPrizes = [
      { place: 1, color: '#FFD700', value: formatCASH(10000) },
      { place: 2, color: '#C0C0C0', value: formatCASH(5000) },
      { place: 3, color: '#CD7F32', value: formatCASH(1500) },
      { place: 4, color: '#A9B2C7', value: formatCASH(1000) },
      { place: 5, color: '#A9B2C7', value: formatCASH(500) }
    ];
    
    // Format for frontend
    const corredoresTop3 = corredoresData.slice(0, 3).map((p, idx) => ({
      position: idx + 1,
      character_name: p.nickname,
      guild_name: p.guild,
      dgs_counted: p.dgs,
      score: p.points
    }));
    
    const matadorTop3 = matadorData.slice(0, 3).map((p, idx) => ({
      position: idx + 1,
      character_name: p.nickname,
      guild_name: p.guild,
      nation: p.nation,
      kills: p.kills
    }));
    
    // Hall da Fama highlights
    const hallHighlights = [
      {
        category: 'Corredor da Semana',
        winner: corredoresTop3[0]
      },
      {
        category: 'Matador da Semana',
        winner: matadorTop3[0]
      }
    ];
    
    return Response.json({
      week_key: weekKey,
      period_start: dates.start,
      period_end: dates.end,
      period_label: periodLabel,
      corredores: {
        top3: corredoresTop3,
        topN: corredoresData,
        prizes: corredoresPrizes,
        periodLabel
      },
      matador: {
        top3: matadorTop3,
        topN: matadorData,
        prizes: matadorPrizes,
        periodLabel
      },
      hall: {
        highlights: hallHighlights
      }
    });
    
  } catch (error) {
    console.error('[rankings_getCurrent] Error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});