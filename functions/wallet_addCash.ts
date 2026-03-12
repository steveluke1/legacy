import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const currentUser = await base44.auth.me();

    if (!currentUser) {
      return Response.json({
        success: false,
        error: 'Você precisa estar logado.'
      }, { status: 401 });
    }

    const { user_id, amount, reason, idempotency_key } = await req.json();

    if (!user_id || !amount || !reason) {
      return Response.json({
        success: false,
        error: 'user_id, amount e reason são obrigatórios.'
      }, { status: 400 });
    }

    // IDEMPOTENCY: Check if already processed (if key provided)
    if (idempotency_key) {
      const ledgerReason = `${reason} [idem:${idempotency_key}]`;
      const existingLedger = await base44.asServiceRole.entities.CashLedger.filter({
        reason: ledgerReason
      });

      if (existingLedger.length > 0) {
        return Response.json({
          success: true,
          message: 'CASH já foi adicionado anteriormente (idempotente)',
          new_balance: existingLedger[0].balance_after || existingLedger[0].new_balance,
          alreadyProcessed: true,
          correlationId: `cash_add_${user_id}_${Date.now()}`
        });
      }
    }

    if (amount <= 0) {
      return Response.json({
        success: false,
        error: 'O valor deve ser positivo.'
      }, { status: 400 });
    }

    // Only admin or the user themselves can add cash
    if (currentUser.role !== 'admin' && currentUser.id !== user_id) {
      return Response.json({
        success: false,
        error: 'Você não tem permissão para adicionar CASH a este usuário.'
      }, { status: 403 });
    }

    // Get or create UserAccount (unified CASH system)
    let userAccounts = await base44.asServiceRole.entities.UserAccount.filter({ user_id });
    let userAccount;

    if (userAccounts.length === 0) {
      // Create UserAccount if doesn't exist
      userAccount = await base44.asServiceRole.entities.UserAccount.create({
        user_id,
        level: 1,
        exp: 0,
        crystal_fragments: 0,
        cash_balance: 0,
        reputation_tier: 'Bronze Crystal',
        avatar_frame: 'default',
        last_daily_reset: new Date().toISOString().split('T')[0]
      });
    } else {
      userAccount = userAccounts[0];
    }

    const currentBalance = userAccount.cash_balance || 0;
    const newBalance = currentBalance + amount;

    // Update UserAccount balance
    await base44.asServiceRole.entities.UserAccount.update(userAccount.id, {
      cash_balance: newBalance
    });

    // Also sync to GameAccount if exists
    const gameAccounts = await base44.asServiceRole.entities.GameAccount.filter({ user_id });
    if (gameAccounts.length > 0) {
      await base44.asServiceRole.entities.GameAccount.update(gameAccounts[0].id, {
        cash_balance: newBalance
      });
    }

    // Create ledger entry (with idempotency marker if provided)
    const ledgerReason = idempotency_key 
      ? `${reason} [idem:${idempotency_key}]`
      : reason;

    await base44.asServiceRole.entities.CashLedger.create({
      account_id: userAccount.id,
      operation: 'ADD',
      amount,
      previous_balance: currentBalance,
      new_balance: newBalance,
      reason: ledgerReason
    });

    return Response.json({
      success: true,
      message: `${amount} CASH adicionados com sucesso`,
      previous_balance: currentBalance,
      new_balance: newBalance,
      correlationId: `cash_add_${userAccount.id}_${Date.now()}`
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});