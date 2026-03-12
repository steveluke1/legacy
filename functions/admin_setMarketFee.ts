import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { getMarketConfig, writeLedgerEntry, writeAuditLog, generateCorrelationId, safeParseJson } from './_shared/marketHelpers.js';

Deno.serve(async (req) => {
  const correlationId = generateCorrelationId();
  
  try {
    const base44 = createClientFromRequest(req);
    
    // Verificar se é admin
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
    
    const body = await req.text();
    const data = safeParseJson(body);
    
    if (!data || typeof data.feePercent !== 'number') {
      return Response.json({
        success: false,
        error: 'feePercent inválido',
        correlationId
      }, {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (data.feePercent < 0 || data.feePercent > 50) {
      return Response.json({
        success: false,
        error: 'feePercent deve estar entre 0 e 50',
        correlationId
      }, {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Buscar ou criar config
    const config = await getMarketConfig(base44);
    const oldFee = config.market_fee_percent;
    
    // Atualizar
    await base44.asServiceRole.entities.MarketConfig.update(config.id, {
      market_fee_percent: data.feePercent,
      updated_by_admin_id: user.id,
      updated_at: new Date().toISOString(),
      notes: {
        oldFee,
        newFee: data.feePercent,
        changedBy: user.email
      }
    });
    
    // Ledger entry
    await writeLedgerEntry(base44, {
      entryType: 'fee_changed',
      actor: 'admin',
      actorUserId: user.id,
      metadata: { oldFee, newFee: data.feePercent },
      correlationId
    });
    
    // Audit log
    await writeAuditLog(base44, {
      action: 'market_fee_changed',
      severity: 'info',
      message: `Taxa de mercado alterada de ${oldFee}% para ${data.feePercent}%`,
      data: { oldFee, newFee: data.feePercent, adminId: user.id },
      correlationId
    });
    
    return Response.json({
      success: true,
      config: {
        market_fee_percent: data.feePercent,
        updated_at: new Date().toISOString()
      },
      correlationId,
      notes: {
        oldFee,
        newFee: data.feePercent
      }
    }, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: 'Erro ao atualizar taxa de mercado',
      correlationId
    }, {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});