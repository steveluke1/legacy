import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { getMarketConfig, generateCorrelationId } from './_shared/marketHelpers.js';

Deno.serve(async (req) => {
  const correlationId = generateCorrelationId();
  
  try {
    const base44 = createClientFromRequest(req);
    
    const config = await getMarketConfig(base44);
    
    return Response.json({
      success: true,
      config: {
        market_fee_percent: config.market_fee_percent,
        pix_mode: config.pix_mode,
        split_mode: config.split_mode,
        updated_at: config.updated_at
      },
      correlationId,
      notes: {
        source: 'MarketConfig',
        dataQuality: 'ok'
      }
    }, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: 'Erro ao buscar configuração do mercado',
      correlationId
    }, {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});