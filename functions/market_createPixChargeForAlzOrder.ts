import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { verifyUserToken } from './_shared/authHelpers.js';
import { efiFetch, isEfiConfigured, getEfiConfig, logEfiOperation } from './_lib/efiClient.js';
import { createHash } from 'node:crypto';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user token
    let user;
    try {
      user = await verifyUserToken(req, base44);
    } catch (authError) {
      return Response.json({ 
        success: false,
        error: authError.message 
      }, { status: 401 });
    }

    const { order_id, idempotency_key } = await req.json();

    if (!order_id || !idempotency_key) {
      return Response.json({ 
        error: 'order_id e idempotency_key são obrigatórios' 
      }, { status: 400 });
    }

    // Check if EFI is configured - if not, use mock mode
    const efiConfigured = isEfiConfigured();
    
    if (!efiConfigured) {
      // MOCK MODE: Return mock PIX data
      const mockTxid = `MOCK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const mockCopyPaste = `00020126580014br.gov.bcb.pix0114+5511999999999${order.price_brl.toFixed(2).padStart(10, '0')}5303986540${order.price_brl.toFixed(2)}5802BR5913CABAL ZIRON6014SAO PAULO62070503***6304XXXX`;
      const mockQrCode = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
      
      const now = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 3600000).toISOString();
      
      // Store mock PixCharge
      await base44.asServiceRole.entities.PixCharge.create({
        pix_charge_id: `pix_${Date.now()}`,
        order_id,
        txid: mockTxid,
        status: 'active',
        brl_amount: order.price_brl,
        copy_paste: mockCopyPaste,
        qr_code_image: mockQrCode,
        expires_at: expiresAt,
        raw_response: { mode: 'mock', note: 'EFI não configurado' },
        created_at: now,
        updated_at: now
      });
      
      await base44.asServiceRole.entities.AlzOrder.update(order.id, {
        status: 'awaiting_pix',
        pix_txid: mockTxid,
        updated_at: now
      });
      
      await base44.asServiceRole.entities.LedgerEntry.create({
        entry_id: `ledger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'PIX_CHARGE_CREATED',
        ref_id: order_id,
        actor: 'buyer',
        actor_id: user.userId,
        amount_brl: order.price_brl,
        metadata: {
          txid: mockTxid,
          mode: 'mock',
          expires_at: expiresAt,
          idempotency_key
        },
        created_at: now
      });
      
      return Response.json({
        success: true,
        txid: mockTxid,
        copy_paste: mockCopyPaste,
        qr_code_image: mockQrCode,
        expires_at: expiresAt,
        notes: { mode: 'mock', warning: 'EFI não configurado - usando modo de testes' }
      });
    }

    // Load order
    const orders = await base44.entities.AlzOrder.filter({ order_id });
    if (orders.length === 0) {
      return Response.json({ error: 'Pedido não encontrado' }, { status: 404 });
    }

    const order = orders[0];

    // Verify ownership
    if (order.buyer_user_id !== user.userId) {
      return Response.json({ error: 'Não autorizado' }, { status: 403 });
    }

    // Check order status
    if (order.status !== 'pending_payment' && order.status !== 'created') {
      return Response.json({ 
        error: 'Pedido já possui cobrança PIX ou está em outro estado',
        status: order.status
      }, { status: 400 });
    }

    // Check for existing PixCharge (idempotency)
    const existingCharges = await base44.entities.PixCharge.filter({ order_id });
    if (existingCharges.length > 0) {
      const existing = existingCharges[0];
      return Response.json({
        success: true,
        txid: existing.txid,
        copy_paste: existing.copy_paste,
        qr_code_image: existing.qr_code_image,
        expires_at: existing.expires_at,
        notes: { from_cache: true }
      });
    }

    // Generate deterministic txid
    const txid = generateTxid(order_id);

    try {
      // Create Pix charge at EFI
      const chargeData = {
        calendario: {
          expiracao: 3600 // 1 hour
        },
        devedor: {
          nome: user.full_name || user.email,
          cpf: order.buyer_email?.replace(/[^0-9]/g, '').padStart(11, '0') || '00000000000'
        },
        valor: {
          original: order.price_brl.toFixed(2)
        },
        chave: getEfiConfig().pixKey,
        solicitacaoPagador: `Pedido ${order_id.substring(0, 8)} - ${order.alz_amount} ALZ`
      };

      // Create charge
      const createResponse = await efiFetch(`/v2/cob/${txid}`, {
        method: 'PUT',
        body: JSON.stringify(chargeData)
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`EFI charge creation failed: ${createResponse.status} - ${errorText}`);
      }

      const chargeResult = await createResponse.json();

      // Get QR Code
      const qrResponse = await efiFetch(`/v2/loc/${chargeResult.loc.id}/qrcode`);
      const qrData = await qrResponse.json();

      const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
      
      await logEfiOperation(base44, 'create_pix_charge', true, { order_id, txid, correlationId: idempotency_key });

      // Store PixCharge
      await base44.asServiceRole.entities.PixCharge.create({
        pix_charge_id: `pix_${Date.now()}`,
        order_id,
        txid,
        status: 'active',
        brl_amount: order.price_brl,
        copy_paste: qrData.qrcode,
        qr_code_image: qrData.imagemQrcode,
        efi_location_id: chargeResult.loc.id,
        expires_at: expiresAt,
        raw_response: chargeResult,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Update order status
      await base44.asServiceRole.entities.AlzOrder.update(order.id, {
        status: 'awaiting_pix',
        pix_txid: txid,
        pix_charge_id: `pix_${Date.now()}`,
        updated_at: new Date().toISOString()
      });

      // Create ledger entry
      await base44.asServiceRole.entities.LedgerEntry.create({
        entry_id: `ledger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'PIX_CHARGE_CREATED',
        ref_id: order_id,
        actor: 'buyer',
        actor_id: user.userId,
        amount_brl: order.price_brl,
        metadata: {
          txid,
          expires_at: expiresAt,
          idempotency_key
        },
        created_at: new Date().toISOString()
      });

      return Response.json({
        success: true,
        txid,
        copy_paste: qrData.qrcode,
        qr_code_image: qrData.imagemQrcode,
        expires_at: expiresAt,
        notes: { efi_location_id: chargeResult.loc.id }
      });

    } catch (efiError) {
      await logEfiOperation(base44, 'create_pix_charge', false, { order_id, txid, error: efiError.message, correlationId: idempotency_key });
      
      return Response.json({
        success: false,
        error: 'Erro ao gerar cobrança PIX. Tente novamente em alguns instantes.',
        details: efiError.message
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in market_createPixChargeForAlzOrder:', error);
    return Response.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 });
  }
});

/**
 * Generate deterministic txid from order_id
 * EFI txid requirements: 26-35 alphanumeric characters
 */
function generateTxid(orderId) {
  const hash = createHash('sha256').update(orderId).digest('hex');
  return hash.substring(0, 32).toUpperCase();
}