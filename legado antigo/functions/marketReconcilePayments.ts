// functions/marketReconcilePayments.js
// Reconcile stuck payments: expire old pending, retry failed, etc.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const correlationId = `reconcile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // ADMIN-ONLY or SYSTEM TOKEN
    const systemToken = Deno.env.get('MARKET_SYSTEM_TOKEN');
    const headerToken = req.headers.get('x-market-system-token');
    
    const isAdmin = user && user.role === 'admin';
    const isSystemAuth = systemToken && headerToken === systemToken;

    if (!isAdmin && !isSystemAuth) {
      return Response.json({
        ok: false,
        error: { code: 'FORBIDDEN', message: 'Somente administradores ou sistema autorizado' }
      }, { status: 403 });
    }

    const { dryRun = false } = await req.json().catch(() => ({}));

    const report = {
      correlation_id: correlationId,
      dry_run: dryRun,
      timestamp: new Date().toISOString(),
      actions: []
    };

    // RULE 1: Expire old pending payments (past expires_at)
    const now = new Date().toISOString();
    
    const pendingPayments = await base44.asServiceRole.entities.MarketPixPayment.filter({
      status: { $in: ['created', 'pix_pending'] },
      expires_at: { $lt: now }
    });

    for (const payment of pendingPayments) {
      if (!dryRun) {
        await base44.asServiceRole.entities.MarketPixPayment.update(payment.id, {
          status: 'expired',
          error_message: 'Pagamento expirou (30min timeout)'
        });
      }
      
      report.actions.push({
        type: 'EXPIRE_PENDING',
        payment_id: payment.id,
        previous_status: payment.status,
        new_status: 'expired',
        expires_at: payment.expires_at
      });
    }

    // RULE 2: Find paid but not settled (potential delivery failures)
    const paidNotSettled = await base44.asServiceRole.entities.MarketPixPayment.filter({
      status: 'paid'
    }, '-created_date', 100);

    for (const payment of paidNotSettled) {
      report.actions.push({
        type: 'PAID_NOT_SETTLED',
        payment_id: payment.id,
        buyer_nic: payment.buyer_nic || 'UNKNOWN',
        error_message: payment.error_message || null,
        recommendation: 'Review and retry settlement manually'
      });
    }

    // RULE 3: Find failed due to BUYER_ONLINE (can be retried)
    const failedOnline = await base44.asServiceRole.entities.MarketPixPayment.filter({
      status: 'failed',
      error_message: { $regex: 'BUYER_ONLINE' }
    }, '-created_date', 50);

    for (const payment of failedOnline) {
      report.actions.push({
        type: 'FAILED_BUYER_ONLINE',
        payment_id: payment.id,
        buyer_nic: payment.buyer_nic || 'UNKNOWN',
        recommendation: 'Retry when buyer is offline'
      });
    }

    console.log(`[marketReconcilePayments:${correlationId}] Complete: ${report.actions.length} actions`);

    return Response.json({
      ok: true,
      data: report
    });

  } catch (error) {
    console.error(`[marketReconcilePayments:${correlationId}] ERROR:`, error);
    
    return Response.json({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro ao reconciliar pagamentos',
        detail: error.message
      }
    }, { status: 500 });
  }
});