/**
 * PIX Provider Adapter
 * Interface unificada para provedores PIX (EFI/outros)
 * Modo MOCK implementado, modo EFI delegado para market_createPixChargeForAlzOrder
 */

export function createPixCharge({ order, amountBRL, buyerEmail, correlationId, mode = 'mock' }) {
  if (mode === 'mock') {
    return createMockPixCharge({ order, amountBRL, buyerEmail, correlationId });
  }
  
  if (mode === 'efi') {
    // EFI real é executado via market_createPixChargeForAlzOrder
    // Este adapter é apenas para compatibilidade
    return {
      provider: 'EFI',
      txId: `EFI-PENDING-${order.order_id}`,
      qrCode: null,
      copyPaste: null,
      raw: {
        note: 'PIX real será criado via market_createPixChargeForAlzOrder',
        correlationId
      }
    };
  }
  
  throw new Error(`Modo PIX inválido: ${mode}`);
}

export function parseWebhook(req, mode = 'mock') {
  if (mode === 'mock') {
    return parseMockWebhook(req);
  }
  
  if (mode === 'efi') {
    throw new Error('Webhook EFI não implementado ainda');
  }
  
  throw new Error(`Modo PIX inválido: ${mode}`);
}

// ============== MOCK IMPLEMENTATION ==============

function createMockPixCharge({ order, amountBRL, buyerEmail, correlationId }) {
  const txId = `MOCK-PIX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const copyPaste = `00020126360014br.gov.bcb.pix0114MOCK${txId}520400005303986540${amountBRL.toFixed(2)}5802BR5913CABAL ZIRON6009SAO PAULO62070503***6304MOCK`;
  
  return {
    provider: 'MOCK',
    txId,
    qrCode: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`, // 1x1 transparent
    copyPaste,
    raw: {
      correlationId,
      orderId: order.order_id,
      amount: amountBRL,
      buyerEmail,
      mockMode: true
    }
  };
}

function parseMockWebhook(req) {
  // Webhook mock não será usado, pois confirmação é manual via buyer_confirmPixPaid_mock
  return {
    txId: null,
    status: 'pending',
    paidAt: null,
    raw: {}
  };
}