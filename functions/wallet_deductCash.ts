import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Deduct CASH from user account (unified balance system)
 * Uses UserAccount.cash_balance as single source of truth
 */
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
      const ledgerReasonPattern = `${reason} [idem:${idempotency_key}]`;
      const existingLedger = await base44.asServiceRole.entities.CashLedger.filter({
        reason: ledgerReasonPattern
      });

      if (existingLedger.length > 0) {
        return Response.json({
          success: true,
          message: 'CASH já foi deduzido anteriormente (idempotente)',
          new_balance: existingLedger[0].balance_after,
          alreadyProcessed: true,
          correlationId: `cash_deduct_${user_id}_${Date.now()}`
        });
      }
    }

    if (amount <= 0) {
      return Response.json({
        success: false,
        error: 'O valor deve ser positivo.'
      }, { status: 400 });
    }

    // Only admin or the user themselves can deduct cash
    if (currentUser.role !== 'admin' && currentUser.id !== user_id) {
      return Response.json({
        success: false,
        error: 'Você não tem permissão para deduzir CASH deste usuário.'
      }, { status: 403 });
    }

    // Get game account
    const gameAccounts = await base44.asServiceRole.entities.GameAccount.filter({ user_id });
    
    if (gameAccounts.length === 0) {
      return Response.json({
        success: false,
        error: 'Conta in-game não encontrada.'
      }, { status: 404 });
    }

    const gameAccount = gameAccounts[0];
    const currentBalance = gameAccount.cash_balance || 0;

    // VALIDATION: Saldo suficiente (prevent negative balance)
    if (currentBalance < amount) {
      return Response.json({
        success: false,
        error: `Saldo insuficiente. Saldo atual: ${currentBalance.toFixed(2)} CASH, tentativa de deduzir: ${amount.toFixed(2)} CASH`,
        current_balance: currentBalance,
        attempted_deduction: amount,
        correlationId: `cash_deduct_failed_${user_id}_${Date.now()}`
      }, { status: 400 });
    }

    const newBalance = currentBalance - amount;

    // VALIDATION: Additional safety - prevent negative result
    if (newBalance < 0) {
      return Response.json({
        success: false,
        error: 'Operação resultaria em saldo negativo (bloqueado por segurança)',
        current_balance: currentBalance,
        attempted_deduction: amount,
        would_result_in: newBalance,
        correlationId: `cash_negative_blocked_${user_id}_${Date.now()}`
      }, { status: 400 });
    }

    // Update balance
    await base44.asServiceRole.entities.GameAccount.update(gameAccount.id, {
      cash_balance: newBalance
    });

    // Create ledger entry (with idempotency marker if provided)
    const ledgerReason = idempotency_key 
      ? `${reason} [idem:${idempotency_key}]`
      : reason;

    await base44.asServiceRole.entities.CashLedger.create({
      user_id,
      amount,
      direction: 'debit',
      reason: ledgerReason,
      balance_after: newBalance
    });

    return Response.json({
      success: true,
      message: `${amount} CASH deduzidos com sucesso`,
      previous_balance: currentBalance,
      new_balance: newBalance,
      correlationId: `cash_deduct_${gameAccount.id}_${Date.now()}`
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});