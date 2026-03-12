import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function getCurrentWeekKey(timezone = 'America/Sao_Paulo') {
  const now = new Date();
  const year = now.getFullYear();
  
  // Simple week calculation (ISO week)
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
  const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

function getWeekDates(weekKey, timezone = 'America/Sao_Paulo') {
  const [year, week] = weekKey.split('-W').map(Number);
  
  // Calculate start of week (Monday)
  const jan1 = new Date(year, 0, 1);
  const daysToFirstMonday = (8 - jan1.getDay()) % 7;
  const firstMonday = new Date(year, 0, 1 + daysToFirstMonday);
  
  const weekStart = new Date(firstMonday);
  weekStart.setDate(firstMonday.getDate() + (week - 1) * 7);
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  return {
    start: weekStart.toISOString(),
    end: weekEnd.toISOString()
  };
}

function formatPeriodLabel(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  
  const startDay = String(startDate.getDate()).padStart(2, '0');
  const startMonth = String(startDate.getMonth() + 1).padStart(2, '0');
  
  const endDay = String(endDate.getDate()).padStart(2, '0');
  const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
  const endYear = endDate.getFullYear();
  
  return `${startDay}/${startMonth} - ${endDay}/${endMonth}/${endYear}`;
}

function formatBRL(value) {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

function formatCASH(value) {
  return `${value.toLocaleString('pt-BR')} CASH`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get config (or use defaults)
    const configs = await base44.asServiceRole.entities.RankingConfig.list(undefined, 1);
    const config = configs && configs.length > 0 ? configs[0] : { timezone: 'America/Sao_Paulo' };
    
    const weekKey = getCurrentWeekKey(config.timezone);
    const dates = getWeekDates(weekKey, config.timezone);
    const periodLabel = formatPeriodLabel(dates.start, dates.end);
    
    // Get REAL data from DGCompletion and TGWarPlayerScore
    const weekStart = new Date(dates.start);
    const weekEnd = new Date(dates.end);
    
    // Corredores: Get REAL DG completions only
    const allDgCompletions = await base44.asServiceRole.entities.DGCompletion.filter({}, '-completed_at', 2000);
    
    // Filter to REAL data only
    const realDgCompletions = allDgCompletions.filter(dg => 
      dg.is_real === true || dg.source === 'GAME_SERVER'
    );
    
    const corredoresMap = {};
    
    realDgCompletions.forEach(dg => {
      const dgDate = new Date(dg.completed_at || dg.created_date);
      if (dgDate >= weekStart && dgDate <= weekEnd) {
        const player = dg.player_name || dg.character_name;
        if (!corredoresMap[player]) {
          corredoresMap[player] = {
            nickname: player,
            guild: dg.guild_name || 'Sem Guild',
            dgs: 0,
            points: 0
          };
        }
        corredoresMap[player].dgs += 1;
        corredoresMap[player].points += 1; // 1 point per DG
      }
    });
    
    const corredoresData = Object.values(corredoresMap)
      .sort((a, b) => b.points - a.points)
      .map((p, idx) => ({
        rank: idx + 1,
        nickname: p.nickname,
        guild: p.guild,
        dgs: p.dgs,
        points: p.points
      }));
    
    // Matador: Get REAL TG kills only
    const allTgKills = await base44.asServiceRole.entities.TGWarPlayerScore.filter({}, '-created_date', 2000);
    
    // Filter to REAL data only
    const realTgKills = allTgKills.filter(kill =>
      kill.is_real === true || kill.source === 'GAME_SERVER'
    );
    
    const matadorMap = {};
    
    realTgKills.forEach(kill => {
      const killDate = new Date(kill.created_date);
      if (killDate >= weekStart && killDate <= weekEnd) {
        const player = kill.character_name;
        if (!matadorMap[player]) {
          matadorMap[player] = {
            nickname: player,
            guild: kill.guild_name || 'Sem Guild',
            nation: kill.nation || kill.faction || 'Capella',
            kills: 0
          };
        }
        matadorMap[player].kills += (kill.kills || 0);
      }
    });
    
    const matadorData = Object.values(matadorMap)
      .sort((a, b) => b.kills - a.kills)
      .map((p, idx) => ({
        rank: idx + 1,
        nickname: p.nickname,
        guild: p.guild,
        nation: p.nation,
        kills: p.kills
      }));
    
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
    
    // Format for frontend (top 3)
    const corredoresTop3 = corredoresData.slice(0, 3).map((p) => ({
      position: p.rank,
      character_name: p.nickname,
      guild_name: p.guild,
      dgs_counted: p.dgs,
      score: p.points
    }));
    
    const matadorTop3 = matadorData.slice(0, 3).map((p) => ({
      position: p.rank,
      character_name: p.nickname,
      guild_name: p.guild,
      nation: p.nation,
      kills: p.kills
    }));
    
    // Hall da Fama highlights
    const hallHighlights = [];
    
    if (corredoresTop3.length > 0) {
      hallHighlights.push({
        category: 'Corredor da Semana',
        winner: corredoresTop3[0]
      });
    }
    
    if (matadorTop3.length > 0) {
      hallHighlights.push({
        category: 'Matador da Semana',
        winner: matadorTop3[0]
      });
    }
    
    return Response.json({
      success: true,
      data: {
        week_key: weekKey,
        period_start: dates.start,
        period_end: dates.end,
        period_label: periodLabel,
        available: corredoresData.length > 0 || matadorData.length > 0,
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
      }
    });
    
  } catch (error) {
    console.error('[rankingsGetCurrent] Error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});