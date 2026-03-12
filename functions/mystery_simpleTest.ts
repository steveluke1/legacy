import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Simple test - purchase 1 box and open it
 */

Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ 
        success: false, 
        error: 'Admin only' 
      }, { status: 401 });
    }

    console.log(`[${requestId}] Simple test started`);

    // Step 1: Purchase 1 box
    const purchaseRes = await base44.functions.invoke('mystery_purchaseBox', { 
      quantity: 1 
    });

    if (!purchaseRes.data || !purchaseRes.data.success) {
      return Response.json({
        success: false,
        error: 'Purchase failed',
        details: purchaseRes.data
      }, { status: 500 });
    }

    const boxId = purchaseRes.data.boxes[0].id;
    console.log(`[${requestId}] Box purchased: ${boxId}`);

    // Step 2: Open the box
    const openRes = await base44.functions.invoke('mystery_openBox', { 
      userLootBoxId: boxId 
    });

    if (!openRes.data || !openRes.data.success) {
      return Response.json({
        success: false,
        error: 'Open failed',
        details: openRes.data
      }, { status: 500 });
    }

    const reward = openRes.data.reward;
    console.log(`[${requestId}] Reward received: ${reward.name}`);

    // Check for legacy items
    const legacyKeywords = ['extensor', 'baixo', 'médio', 'alto', 'altíssimo', 'extremo'];
    const isLegacy = legacyKeywords.some(kw => reward.name.toLowerCase().includes(kw));

    return Response.json({
      success: true,
      test: 'Purchase + Open 1 box',
      purchaseResult: purchaseRes.data,
      openResult: openRes.data,
      rewardReceived: reward.name,
      legacyItemDetected: isLegacy,
      verdict: isLegacy 
        ? '❌ FAIL - Legacy item detected' 
        : '✅ PASS - New mystery reward received'
    });

  } catch (error) {
    console.error(`[${requestId}] Test error:`, error);
    return Response.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
});