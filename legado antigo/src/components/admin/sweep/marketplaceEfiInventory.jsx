/**
 * ALZ Marketplace + EFI PIX/SPLIT - Inventory Registry
 * Complete registry of all entities, functions, routes, and components
 */

export const marketplaceEfiInventory = {
  // ENTITIES
  entities: [
    // Core Marketplace
    { name: 'AlzListing', purpose: 'Anúncios de ALZ à venda', required_fields: ['listing_id', 'seller_user_id', 'alz_amount', 'price_brl', 'status'] },
    { name: 'AlzLock', purpose: 'Escrow de ALZ travado', required_fields: ['lock_id', 'listing_id', 'alz_amount', 'status', 'idempotency_key'] },
    { name: 'AlzOrder', purpose: 'Pedidos de compra de ALZ', required_fields: ['order_id', 'listing_id', 'buyer_user_id', 'character_nick', 'status', 'price_brl', 'alz_amount'] },
    
    // EFI PIX Integration
    { name: 'MarketSettings', purpose: 'Configurações globais do marketplace', required_fields: ['id', 'market_fee_percent'] },
    { name: 'SellerPayoutProfile', purpose: 'Perfil de pagamento do vendedor', required_fields: ['seller_user_id', 'efi_pix_key'] },
    { name: 'PixCharge', purpose: 'Cobranças PIX EFI', required_fields: ['pix_charge_id', 'order_id', 'txid', 'status', 'brl_amount'] },
    { name: 'SplitPayout', purpose: 'Split de pagamento para vendedor', required_fields: ['payout_id', 'order_id', 'seller_user_id', 'net_brl', 'status'] },
    { name: 'LedgerEntry', purpose: 'Ledger append-only de auditoria', required_fields: ['entry_id', 'type', 'ref_id', 'actor', 'created_at'] }
  ],

  // BACKEND FUNCTIONS
  functions: [
    // Config & Admin
    { name: 'market_getConfig', purpose: 'Obter configurações do marketplace' },
    { name: 'admin_setMarketFeePercent', purpose: 'Alterar taxa do marketplace (admin)' },
    { name: 'admin_configureEfiWebhook', purpose: 'Configurar webhook EFI (admin)' },
    
    // Buyer Flow
    { name: 'market_listListings', purpose: 'Listar anúncios ativos' },
    { name: 'buyer_validateCharacter', purpose: 'Validar personagem do comprador' },
    { name: 'buyer_createOrder', purpose: 'Criar pedido de compra' },
    { name: 'market_createPixChargeForAlzOrder', purpose: 'Gerar cobrança PIX para pedido' },
    { name: 'buyer_confirmPixPaid_mock', purpose: 'Confirmar pagamento (mock/teste)' },
    { name: 'market_getOrderStatus', purpose: 'Obter status do pedido' },
    
    // Seller Flow
    { name: 'seller_upsertProfile', purpose: 'Criar/atualizar perfil de vendedor' },
    { name: 'market_createAlzListing', purpose: 'Criar anúncio e travar ALZ' },
    { name: 'seller_cancelListing', purpose: 'Cancelar anúncio' },
    
    // Webhook & Delivery
    { name: 'efi_pixWebhook', purpose: 'Webhook de confirmação PIX (EFI)' },
    { name: 'delivery_run', purpose: 'Processar entrega de ALZ' },
    
    // Cron
    { name: 'market_releaseExpiredLocks', purpose: 'Liberar locks expirados (cron diário)' },
    
    // Admin
    { name: 'admin_listOrders', purpose: 'Listar pedidos (admin)' },
    { name: 'admin_seedMarketplaceDemoData', purpose: 'Criar dados demo' }
  ],

  // SHARED UTILITIES
  utilities: [
    { name: '_lib/efiClient', purpose: 'Cliente mTLS EFI com OAuth', exports: ['getEfiConfig', 'efiFetch', 'getAccessToken', 'isEfiConfigured'] },
    { name: '_lib/gameIntegration', purpose: 'Stubs de integração com servidor do jogo', exports: ['validateCharacterNick', 'deliverAlz', 'lockAlzFromGame', 'releaseAlzToGame'] },
    { name: '_shared/pixProviderAdapter', purpose: 'Adapter PIX (mock/real)' },
    { name: '_shared/splitAdapter', purpose: 'Adapter Split (mock/real)' },
    { name: '_shared/marketHelpers', purpose: 'Helpers do marketplace' }
  ],

  // FRONTEND ROUTES
  routes: [
    // Public
    { path: '/mercado/alz', component: 'MercadoAlz', purpose: 'Marketplace - Listar anúncios' },
    { path: '/mercado/alz/checkout/:listingId', component: 'MercadoAlzCheckout', purpose: 'Checkout com confirmação PIX' },
    { path: '/pedido-alz/:orderId', component: 'PedidoAlzDetalhe', purpose: 'Detalhes do pedido com timeline' },
    
    // Seller
    { path: '/vender/alz', component: 'VenderAlz', purpose: 'Área do vendedor' },
    
    // User Area
    { path: '/minha-conta/pedidos-alz', component: 'MinhaContaPedidosAlz', purpose: 'Meus pedidos de compra' },
    
    // Terms
    { path: '/termos-marketplace-alz', component: 'TermosMarketplaceAlz', purpose: 'Termos do marketplace' },
    
    // Admin
    { path: 'AdminDashboard (tab: marketplace-alz)', component: 'AdminMarketplace', purpose: 'Administração do marketplace' }
  ],

  // KEY COMPONENTS
  keyComponents: [
    { name: 'ListingCard', path: 'components/marketplace/ListingCard', purpose: 'Card de anúncio' },
    { name: 'OrderStatusTimeline', path: 'components/marketplace/OrderStatusTimeline', purpose: 'Timeline de status do pedido' },
    { name: 'PixConfirmationScreen', path: 'components/marketplace/PixConfirmationScreen', purpose: 'Tela de confirmação antes de gerar PIX' },
    { name: 'MarketFeeSettings', path: 'components/marketplace/MarketFeeSettings', purpose: 'Card de configuração de taxa (admin)' },
    { name: 'SellerPayoutForm', path: 'components/marketplace/SellerPayoutForm', purpose: 'Formulário de perfil de pagamento do vendedor' },
    { name: 'EfiConfigPanel', path: 'components/admin/EfiConfigPanel', purpose: 'Painel de configuração EFI (admin)' },
    { name: 'MarketplaceQAChecklist', path: 'components/admin/MarketplaceQAChecklist', purpose: 'Checklist automatizado de QA' },
    { name: 'marketplaceClient', path: 'components/marketplace/marketplaceClient', purpose: 'Cliente API com fallback entities' },
    { name: 'adminMarketplaceClient', path: 'components/marketplace/adminMarketplaceClient', purpose: 'Cliente API admin' }
  ],

  // DOCUMENTATION
  docsFiles: [
    { name: 'RBAC_CONFIGURATION_GUIDE', path: 'components/admin/RBAC_CONFIGURATION_GUIDE', purpose: 'Guia de configuração RBAC' },
    { name: 'DATA_MODEL_FLOW', path: 'components/admin/DATA_MODEL_FLOW', purpose: 'Fluxo e modelo de dados' }
  ],

  // ENV VARS REQUIRED
  envVars: [
    { name: 'EFI_CLIENT_ID', required: true, purpose: 'Client ID EFI' },
    { name: 'EFI_CLIENT_SECRET', required: true, purpose: 'Client Secret EFI' },
    { name: 'EFI_CERT_PEM_B64', required: true, purpose: 'Certificado mTLS (base64 PEM)' },
    { name: 'EFI_KEY_PEM_B64', required: true, purpose: 'Chave privada mTLS (base64 PEM)' },
    { name: 'EFI_PIX_KEY', required: true, purpose: 'Chave PIX da plataforma' },
    { name: 'EFI_ENV', required: false, purpose: 'Ambiente EFI (homolog/prod)', default: 'homolog' },
    { name: 'EFI_WEBHOOK_PATH', required: false, purpose: 'Path do webhook', default: '/api/efi_pixWebhook' },
    { name: 'EFI_WEBHOOK_SHARED_SECRET', required: false, purpose: 'Shared secret para validação de webhook' },
    { name: 'EFI_WEBHOOK_IP_ALLOWLIST', required: false, purpose: 'IPs permitidos para webhook (comma-separated)' }
  ]
};