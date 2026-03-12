/**
 * Marketplace Client
 * Cliente para operações do marketplace de ALZ
 */

import { base44 } from '@/api/base44Client';

const safeParseJson = (text) => {
  if (!text || typeof text !== 'string') return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export const marketplaceClient = {
  // Config
  async getConfig() {
    try {
      const response = await base44.functions.invoke('market_getConfig', {});
      return response.data;
    } catch (error) {
      // Fallback para config padrão
      return {
        success: true,
        config: {
          market_fee_percent: 1.5,
          pix_mode: 'mock',
          split_mode: 'mock'
        },
        notes: { source: 'fallback' }
      };
    }
  },

  // Listings
  async listListings({ page = 1, limit = 20, sortBy = '-created_date' } = {}) {
    try {
      const response = await base44.functions.invoke('market_listListings', { page, limit, sortBy });
      return response.data;
    } catch (error) {
      throw new Error('Erro ao buscar anúncios');
    }
  },

  // Validate Character
  async validateCharacter(characterName) {
    try {
      const response = await base44.functions.invoke('buyer_validateCharacter', { character_name: characterName });
      return response.data;
    } catch (error) {
      throw new Error('Erro ao validar personagem');
    }
  },

  // Create Order
  async createOrder({ listing_id, buyer_character_name, character_snapshot }) {
    try {
      const response = await base44.functions.invoke('buyer_createOrder', {
        listing_id,
        buyer_character_name,
        character_snapshot
      });
      return response.data;
    } catch (error) {
      const errorData = safeParseJson(error.response?.data);
      throw new Error(errorData?.error || 'Erro ao criar pedido');
    }
  },

  // Confirm PIX (Mock)
  async confirmPixMock(orderId) {
    try {
      const response = await base44.functions.invoke('buyer_confirmPixPaid_mock', { order_id: orderId });
      return response.data;
    } catch (error) {
      const errorData = safeParseJson(error.response?.data);
      throw new Error(errorData?.error || 'Erro ao confirmar pagamento');
    }
  },

  // Get Order Status
  async getOrderStatus(orderId, token) {
    try {
      const response = await base44.functions.invoke('market_getOrderStatus', { token, order_id: orderId });
      return response.data;
    } catch (error) {
      throw new Error('Erro ao buscar status do pedido');
    }
  },

  // Seller: Upsert Profile
  async upsertSellerProfile({ full_name, cpf, efi_pix_key }) {
    try {
      const response = await base44.functions.invoke('seller_upsertProfile', {
        full_name,
        cpf,
        efi_pix_key
      });
      return response.data;
    } catch (error) {
      const errorData = safeParseJson(error.response?.data);
      throw new Error(errorData?.error || 'Erro ao salvar perfil');
    }
  },

  // Seller: Create Listing
  async createListing({ seller_character_name, alz_amount, price_brl }) {
    try {
      const response = await base44.functions.invoke('seller_createListing', {
        seller_character_name,
        alz_amount,
        price_brl
      });
      return response.data;
    } catch (error) {
      const errorData = safeParseJson(error.response?.data);
      throw new Error(errorData?.error || 'Erro ao criar anúncio');
    }
  },

  // Seller: Lock ALZ
  async lockAlz({ listing_id, idempotency_key }) {
    try {
      const response = await base44.functions.invoke('seller_lockAlzForListing', {
        listing_id,
        idempotency_key
      });
      return response.data;
    } catch (error) {
      const errorData = safeParseJson(error.response?.data);
      throw new Error(errorData?.error || 'Erro ao travar ALZ');
    }
  },

  // Seller: Cancel Listing
  async cancelListing(listingId) {
    try {
      const response = await base44.functions.invoke('seller_cancelListing', { listing_id: listingId });
      return response.data;
    } catch (error) {
      const errorData = safeParseJson(error.response?.data);
      throw new Error(errorData?.error || 'Erro ao cancelar anúncio');
    }
  },

  // Get My Orders
  async getMyOrders(userId, token) {
    try {
      const response = await base44.functions.invoke('market_getMyOrders', { token });
      return response.data;
    } catch (error) {
      throw new Error('Erro ao buscar pedidos');
    }
  }
};