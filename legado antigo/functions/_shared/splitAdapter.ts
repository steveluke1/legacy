/**
 * Split Adapter
 * Interface unificada para split de pagamentos
 * Modo MOCK implementado, modo EFI preparado para integração futura
 */

export function planSplit({ amountBRL, feePercent, sellerPixKey, sellerName, correlationId, mode = 'mock' }) {
  // Cálculo da taxa
  const marketFeeBRL = (amountBRL * feePercent) / 100;
  const sellerNetBRL = amountBRL - marketFeeBRL;
  
  if (mode === 'mock') {
    return {
      marketFeeBRL,
      sellerNetBRL,
      splits: [
        {
          type: 'market_fee',
          recipient: 'CABAL_ZIRON',
          amount: marketFeeBRL,
          pixKey: null,
          status: 'planned'
        },
        {
          type: 'seller_payout',
          recipient: sellerName,
          amount: sellerNetBRL,
          pixKey: sellerPixKey,
          status: 'planned'
        }
      ],
      correlationId,
      mode: 'mock',
      notes: {
        warning: 'Modo MOCK: split planejado mas não executado'
      }
    };
  }
  
  if (mode === 'efi') {
    // Split EFI real: preparar dados para EFI Split API
    // Referência: https://dev.efipay.com.br/docs/api-pix/split-de-pagamento
    return {
      marketFeeBRL,
      sellerNetBRL,
      splits: [
        {
          type: 'percentage',
          recipient: 'platform',
          amount: marketFeeBRL,
          percentage: feePercent,
          pixKey: null, // Plataforma recebe automaticamente
          status: 'planned'
        },
        {
          type: 'fixed',
          recipient: sellerName,
          amount: sellerNetBRL,
          pixKey: sellerPixKey,
          status: 'planned'
        }
      ],
      correlationId,
      mode: 'efi',
      notes: {
        info: 'Split EFI configurado - executar via API EFI após confirmação PIX'
      }
    };
  }
  
  throw new Error(`Modo split inválido: ${mode}`);
}

export async function executeSplit({ splitPlan, txId, base44, correlationId, mode = 'mock' }) {
  if (mode === 'mock') {
    return {
      success: true,
      splitId: `MOCK-SPLIT-${Date.now()}`,
      splits: splitPlan.splits.map(s => ({ ...s, status: 'mock_completed' })),
      correlationId,
      notes: {
        warning: 'Modo MOCK: split simulado'
      }
    };
  }
  
  if (mode === 'efi') {
    // Execução de split EFI
    // Nota: API EFI Split pode requerer configuração prévia de split no dashboard EFI
    // Por ora, registramos o split como pending e será processado pelo EFI automaticamente
    // se configurado corretamente na cobrança
    return {
      success: true,
      splitId: `EFI-SPLIT-${txId}`,
      splits: splitPlan.splits.map(s => ({ ...s, status: 'scheduled' })),
      correlationId,
      notes: {
        info: 'Split EFI agendado - processado pela EFI após confirmação do PIX'
      }
    };
  }
  
  throw new Error(`Modo split inválido: ${mode}`);
}