// functions/marketListFailedPayments.js
// List failed or stuck payments for admin review and retry

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
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

    const { status, limit = 50 } = await req.json().catch(() => ({}));

    // Build filter
    const filter = {};
    
    if (status) {
      filter.status = status;
    } else {
      // Default: failed or expired
      filter.status = { $in: ['failed', 'expired'] };
    }

    // Fetch failed/expired payments
    const payments = await base44.asServiceRole.entities.MarketPixPayment.filter(
      filter,
      '-created_date',
      limit
    );

    return Response.json({
      ok: true,
      data: {
        payments: payments.map(p => ({
          id: p.id,
          buyer_user_id: p.buyer_user_id,
          buyer_nic: p.buyer_nic || null,
          buyer_character_idx: p.buyer_character_idx || null,
          status: p.status,
          total_brl_cents: p.total_brl_cents,
          alz_amount: p.alz_amount,
          efi_txid: p.efi_txid?.substring(0, 8) + '***',
          error_message: p.error_message || null,
          created_date: p.created_date,
          expires_at: p.expires_at,
          settled_at: p.settled_at
        })),
        count: payments.length
      }
    });

  } catch (error) {
    console.error('[marketListFailedPayments] ERROR:', error);
    
    return Response.json({
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Erro ao listar pagamentos',
        detail: error.message
      }
    }, { status: 500 });
  }
});