import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { generateCorrelationId } from './_shared/marketHelpers.js';

Deno.serve(async (req) => {
  const correlationId = generateCorrelationId();
  
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({
        success: false,
        error: 'Não autorizado',
        correlationId
      }, {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Buscar ordens em revisão ou com problemas
    const disputeStatuses = ['in_review', 'failed', 'refunded_blocked'];
    const disputes = await base44.asServiceRole.entities.AlzOrder.filter(
      {},
      '-created_date',
      100
    );
    
    const filteredDisputes = disputes.filter(o => disputeStatuses.includes(o.status));
    
    return Response.json({
      success: true,
      disputes: filteredDisputes.map(o => ({
        order_id: o.order_id,
        buyer_character_name: o.buyer_character_name,
        alz_amount: o.alz_amount,
        price_brl: o.price_brl,
        status: o.status,
        created_date: o.created_date,
        notes: o.notes
      })),
      total: filteredDisputes.length,
      correlationId,
      notes: {
        source: 'AlzOrder',
        placeholder: true
      }
    }, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: 'Erro ao listar disputas',
      correlationId
    }, {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});