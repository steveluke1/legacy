import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    
    const config = {
      players: body.players || 1000,
      guilds: body.guilds || 40,
      services: body.services || 200,
      market_listings: body.market_listings || 300
    };

    const results = {};
    const startTime = Date.now();

    // Step 1: Guilds
    try {
      const guildsRes = await base44.asServiceRole.functions.invoke('seed_demoGuilds', {
        count: config.guilds
      });
      results.guilds = guildsRes.data;
    } catch (e) {
      results.guilds = { success: false, error: e.message };
    }

    // Step 2: Players
    try {
      const playersRes = await base44.asServiceRole.functions.invoke('seed_demoPlayers', {
        count: config.players,
        batchSize: 100
      });
      results.players = playersRes.data;
    } catch (e) {
      results.players = { success: false, error: e.message };
    }

    // Wait for data to be available
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3-7: Run in parallel with timeout handling
    const [rankingsRes, marketRes, servicesRes, tgRes, hallRes] = await Promise.allSettled([
      base44.asServiceRole.functions.invoke('seed_demoRankings', {}),
      base44.asServiceRole.functions.invoke('seed_demoMarket', { count: config.market_listings }),
      base44.asServiceRole.functions.invoke('seed_demoServices', { count: config.services }),
      base44.asServiceRole.functions.invoke('seed_demoTG', {}),
      base44.asServiceRole.functions.invoke('seed_demoHallAndCorredores', {})
    ]);

    results.rankings = rankingsRes.status === 'fulfilled' ? rankingsRes.value.data : { success: false, error: rankingsRes.reason?.message || 'Failed' };
    results.market = marketRes.status === 'fulfilled' ? marketRes.value.data : { success: false, error: marketRes.reason?.message || 'Failed' };
    results.services = servicesRes.status === 'fulfilled' ? servicesRes.value.data : { success: false, error: servicesRes.reason?.message || 'Failed' };
    results.tg = tgRes.status === 'fulfilled' ? tgRes.value.data : { success: false, error: tgRes.reason?.message || 'Failed' };
    results.hall_corredores = hallRes.status === 'fulfilled' ? hallRes.value.data : { success: false, error: hallRes.reason?.message || 'Failed' };

    const duration = Math.round((Date.now() - startTime) / 1000);

    return Response.json({
      success: true,
      message: `Mundo demo CABAL ZIRON criado com sucesso em ${duration}s`,
      config: config,
      results: results,
      summary: {
        guilds: results.guilds?.created || 0,
        players: results.players?.created || 0,
        rankings: results.rankings?.created || {},
        market: results.market?.created || 0,
        services: results.services?.created || 0,
        tg: results.tg?.created || {},
        hall: results.hall_corredores?.created || 0
      }
    });

  } catch (error) {
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});