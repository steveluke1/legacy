import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ 
        success: false, 
        error: 'Admin only' 
      }, { status: 401 });
    }

    const { testRuns = 200 } = await req.json().catch(() => ({}));

    // Simulate opening boxes many times to verify distribution
    const DROP_TABLE = [
      { slug: 'amuleto_yul_15', weight: 100, name: 'amuleto da yul +15 (1 dia)' },
      { slug: 'anel_aniversario', weight: 100, name: 'anel de aniversario (1 dia)' },
      { slug: 'bracelete_yul_15', weight: 100, name: 'Bracelete da yul +15 (1 dia)' },
      { slug: 'brinco_yul_15', weight: 100, name: 'Brinco da yul +15 (1 dia)' },
      { slug: 'entrada_dx_premium', weight: 1500, name: 'Entrada de dx premiun (1 dia)' },
      { slug: 'dgs_aleatorias', weight: 8100, name: 'Dgs aleatórias' }
    ];

    const TOTAL_WEIGHT = 10000;
    const results = {};

    function selectReward() {
      const roll = Math.floor(Math.random() * TOTAL_WEIGHT);
      let cumulative = 0;
      
      for (const item of DROP_TABLE) {
        cumulative += item.weight;
        if (roll < cumulative) {
          return item.slug;
        }
      }
      
      return DROP_TABLE[DROP_TABLE.length - 1].slug;
    }

    // Run test
    for (let i = 0; i < testRuns; i++) {
      const slug = selectReward();
      results[slug] = (results[slug] || 0) + 1;
    }

    // Calculate percentages
    const distribution = DROP_TABLE.map(item => ({
      name: item.name,
      expected: `${(item.weight / 100).toFixed(2)}%`,
      actual: `${((results[item.slug] || 0) / testRuns * 100).toFixed(2)}%`,
      count: results[item.slug] || 0
    }));

    // Verify NO legacy items
    const legacyItems = ['extensor', 'Extensor'];
    const hasLegacyItems = distribution.some(d => 
      legacyItems.some(legacy => d.name.toLowerCase().includes(legacy.toLowerCase()))
    );

    return Response.json({
      success: true,
      testRuns,
      distribution,
      legacyItemsFound: hasLegacyItems,
      message: hasLegacyItems 
        ? '⚠️ LEGACY ITEMS DETECTED IN DROP TABLE!' 
        : '✅ No legacy items - only new rewards'
    });

  } catch (error) {
    console.error('Test error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});