import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * ADMIN ONLY - Validates mystery box system integrity
 * Checks:
 * - Drop table probabilities sum to 100%
 * - All reward templates exist and are active
 * - No legacy items in active pool
 * - Box configuration is correct
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

    const checks = {
      mysteryBoxExists: false,
      mysteryBoxActive: false,
      rewardTemplatesCount: 0,
      allRewardsActive: true,
      legacyBoxInactive: false,
      legacyTemplatesInactive: true,
      probabilitySumCorrect: false,
      errors: []
    };

    // Check mystery box type
    const mysteryBoxes = await base44.asServiceRole.entities.LootBoxType.filter({ 
      slug: 'caixa-misteriosa-tchapi' 
    });
    
    checks.mysteryBoxExists = mysteryBoxes.length > 0;
    
    if (checks.mysteryBoxExists) {
      const box = mysteryBoxes[0];
      checks.mysteryBoxActive = box.isActive;
      
      const total = box.commonChance + box.rareChance + box.epicChance + box.legendaryChance;
      checks.probabilitySumCorrect = Math.abs(total - 100) < 0.01;
      
      if (!checks.probabilitySumCorrect) {
        checks.errors.push(`Probability sum is ${total}%, should be 100%`);
      }
    } else {
      checks.errors.push('Mystery box type not found');
    }

    // Check reward templates
    const rewards = await base44.asServiceRole.entities.MysteryReward.list();
    checks.rewardTemplatesCount = rewards.length;
    
    const expectedSlugs = [
      'amuleto_yul_15',
      'anel_aniversario',
      'bracelete_yul_15',
      'brinco_yul_15',
      'entrada_dx_premium',
      'dgs_aleatorias'
    ];
    
    const activeRewards = rewards.filter(r => r.isActive);
    checks.allRewardsActive = activeRewards.length === rewards.length;
    
    const missingSlugs = expectedSlugs.filter(slug => 
      !rewards.some(r => r.slug === slug)
    );
    
    if (missingSlugs.length > 0) {
      checks.errors.push(`Missing reward templates: ${missingSlugs.join(', ')}`);
    }

    // Check legacy box is inactive
    const legacyBoxes = await base44.asServiceRole.entities.LootBoxType.filter({ 
      slug: 'caixa-extensor-tchope' 
    });
    
    if (legacyBoxes.length > 0) {
      checks.legacyBoxInactive = !legacyBoxes[0].isActive;
      if (legacyBoxes[0].isActive) {
        checks.errors.push('Legacy box (caixa-extensor-tchope) is still ACTIVE');
      }
    }

    // Check legacy templates are inactive
    const legacyTemplates = await base44.asServiceRole.entities.ExtensorTemplate.filter({
      isActive: true
    });
    
    checks.legacyTemplatesInactive = legacyTemplates.length === 0;
    
    if (legacyTemplates.length > 0) {
      checks.errors.push(`${legacyTemplates.length} legacy ExtensorTemplates still active`);
    }

    const allChecksPassed = 
      checks.mysteryBoxExists &&
      checks.mysteryBoxActive &&
      checks.rewardTemplatesCount === 6 &&
      checks.allRewardsActive &&
      checks.legacyTemplatesInactive &&
      checks.probabilitySumCorrect &&
      checks.errors.length === 0;

    return Response.json({
      success: true,
      allChecksPassed,
      checks,
      status: allChecksPassed ? '✅ ALL CHECKS PASSED' : '⚠️ ISSUES FOUND'
    });

  } catch (error) {
    console.error('Validation error:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});