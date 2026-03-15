import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * ADMIN ONLY - QA Test Harness
 * Tests bulk box openings and validates distribution
 */

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

    const { testQuantity = 100 } = await req.json().catch(() => ({}));

    console.log(`[QA TEST] Admin ${user.id} testing ${testQuantity} box openings`);

    // Create test boxes
    const mysteryBoxTypes = await base44.asServiceRole.entities.LootBoxType.filter({ 
      slug: 'caixa-misteriosa-tchapi' 
    });
    
    if (mysteryBoxTypes.length === 0) {
      return Response.json({
        success: false,
        error: 'Mystery box type not found - run mystery_seedRewardsAndBox first'
      }, { status: 404 });
    }

    const boxType = mysteryBoxTypes[0];

    // Create test boxes
    const testBoxesData = Array.from({ length: testQuantity }, () => ({
      user_id: user.id,
      loot_box_type_id: boxType.id,
      status: 'unopened'
    }));
    
    const createdBoxes = await base44.asServiceRole.entities.UserLootBox.bulkCreate(testBoxesData);
    console.log(`[QA TEST] Created ${createdBoxes.length} test boxes`);

    // Open them (using service role for admin testing)
    const openRes = await base44.asServiceRole.functions.invoke('mystery_openMultipleBoxes', { 
      quantity: testQuantity 
    });

    if (!openRes.data || !openRes.data.success) {
      return Response.json({
        success: false,
        error: 'Failed to open test boxes',
        details: openRes.data
      }, { status: 500 });
    }

    const rewards = openRes.data.rewards || [];
    
    // Analyze results
    const distribution = {};
    const legacyCheck = [];
    
    rewards.forEach(reward => {
      distribution[reward.name] = (distribution[reward.name] || 0) + 1;
      
      // Check for legacy items
      const legacyKeywords = ['extensor', 'baixo', 'médio', 'alto', 'altíssimo', 'extremo'];
      if (legacyKeywords.some(kw => reward.name.toLowerCase().includes(kw))) {
        legacyCheck.push(reward.name);
      }
    });

    const distributionReport = Object.entries(distribution).map(([name, count]) => ({
      name,
      count,
      percentage: `${(count / testQuantity * 100).toFixed(2)}%`
    })).sort((a, b) => b.count - a.count);

    return Response.json({
      success: true,
      testQuantity,
      totalOpened: rewards.length,
      distribution: distributionReport,
      legacyItemsDetected: legacyCheck,
      verdict: legacyCheck.length === 0 
        ? '✅ PASS - No legacy items found'
        : `❌ FAIL - ${legacyCheck.length} legacy items detected`,
      message: legacyCheck.length === 0
        ? 'All rewards are from the new mystery box pool'
        : 'WARNING: Legacy extensor items are still being dropped!'
    });

  } catch (error) {
    console.error('[QA TEST] Error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});