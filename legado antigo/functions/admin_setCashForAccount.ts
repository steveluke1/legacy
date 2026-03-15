import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Admin-protected function to set CASH for an account
 * Replaces direct entity access from frontend
 */
Deno.serve(async (req) => {
  try {
    const { adminToken, accountId, operation, amount } = await req.json();

    if (!adminToken || !accountId || !operation || amount === undefined) {
      return Response.json({
        success: false,
        error: 'adminToken, accountId, operation e amount são obrigatórios'
      }, { status: 400 });
    }

    // SECURITY: Verify admin token
    const base44 = createClientFromRequest(req);
    
    // Try to get admin user from token
    let adminUser;
    try {
      adminUser = await base44.auth.me();
      if (!adminUser || adminUser.role !== 'admin') {
        return Response.json({
          success: false,
          error: 'Apenas administradores podem gerenciar CASH'
        }, { status: 403 });
      }
    } catch (error) {
      return Response.json({
        success: false,
        error: 'Token de administrador inválido'
      }, { status: 401 });
    }

    // Get the game account
    const accounts = await base44.asServiceRole.entities.GameAccount.filter({ id: accountId });
    
    if (accounts.length === 0) {
      return Response.json({
        success: false,
        error: 'Conta não encontrada'
      }, { status: 404 });
    }

    const account = accounts[0];
    const currentBalance = account.cash_balance || 0;
    let newBalance;

    // Generate idempotency key for this operation
    const idempotencyKey = `admin_${operation}_${accountId}_${amount}_${adminUser.id}`;

    if (operation === 'ADD') {
      // Use wallet_addCash function with idempotency
      const response = await base44.asServiceRole.functions.invoke('wallet_addCash', {
        user_id: account.user_id,
        amount,
        reason: `Admin manual: Adicionar ${amount} CASH`,
        idempotency_key: idempotencyKey
      });

      if (!response.data.success) {
        return Response.json({
          success: false,
          error: response.data.error
        }, { status: 400 });
      }

      newBalance = response.data.new_balance;

    } else if (operation === 'SET') {
      // Calculate difference and use appropriate wallet function
      const diff = amount - currentBalance;
      
      if (diff > 0) {
        const response = await base44.asServiceRole.functions.invoke('wallet_addCash', {
          user_id: account.user_id,
          amount: diff,
          reason: `Admin manual: Definir saldo para ${amount} CASH`,
          idempotency_key: idempotencyKey
        });

        if (!response.data.success) {
          return Response.json({
            success: false,
            error: response.data.error
          }, { status: 400 });
        }

        newBalance = response.data.new_balance;
      } else if (diff < 0) {
        const response = await base44.asServiceRole.functions.invoke('wallet_deductCash', {
          user_id: account.user_id,
          amount: Math.abs(diff),
          reason: `Admin manual: Definir saldo para ${amount} CASH`,
          idempotency_key: idempotencyKey
        });

        if (!response.data.success) {
          return Response.json({
            success: false,
            error: response.data.error
          }, { status: 400 });
        }

        newBalance = response.data.new_balance;
      } else {
        newBalance = currentBalance;
      }
    } else {
      return Response.json({
        success: false,
        error: 'Operação inválida. Use ADD ou SET.'
      }, { status: 400 });
    }

    // Create admin audit log
    await base44.asServiceRole.entities.AdminAuditLog.create({
      admin_user_id: adminUser.id,
      action: 'ADMIN_SET_CASH',
      target_type: 'GameAccount',
      target_id: accountId,
      metadata: {
        operation,
        amount,
        previous_balance: currentBalance,
        new_balance: newBalance,
        username: account.username
      }
    });

    return Response.json({
      success: true,
      message: `CASH ${operation === 'ADD' ? 'adicionado' : 'definido'} com sucesso`,
      new_balance: newBalance,
      correlationId: `admin_cash_${accountId}_${Date.now()}`
    });

  } catch (error) {
    console.error('[admin_setCashForAccount] ERROR:', error);
    
    return Response.json({
      success: false,
      error: error.message,
      correlationId: `error_${Date.now()}`
    }, { status: 500 });
  }
});