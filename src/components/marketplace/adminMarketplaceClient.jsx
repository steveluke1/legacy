/**
 * Admin Marketplace Client
 * Cliente para operações administrativas do marketplace
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

export const adminMarketplaceClient = {
  // Get Config
  async getConfig() {
    try {
      const response = await base44.functions.invoke('market_getConfig', {});
      return response.data;
    } catch (error) {
      return {
        success: true,
        config: { market_fee_percent: 1.5 },
        notes: { source: 'fallback' }
      };
    }
  },

  // Set Market Fee
  async setMarketFee(feePercent) {
    try {
      const response = await base44.functions.invoke('admin_setMarketFee', { feePercent });
      return response.data;
    } catch (error) {
      const errorData = safeParseJson(error.response?.data);
      throw new Error(errorData?.error || 'Erro ao atualizar taxa');
    }
  },

  // List Orders
  async listOrders({ status, page = 1, limit = 50 } = {}) {
    try {
      const response = await base44.functions.invoke('admin_listOrders', { status, page, limit });
      return response.data;
    } catch (error) {
      // Fallback
      try {
        const filter = status ? { status } : {};
        const orders = await base44.asServiceRole.entities.AlzOrder.filter(filter, '-created_date', limit);
        return {
          success: true,
          orders: orders.map(o => ({
            order_id: o.order_id,
            buyer_character_name: o.buyer_character_name,
            alz_amount: o.alz_amount,
            price_brl: o.price_brl,
            market_fee_brl: o.market_fee_brl,
            status: o.status,
            created_date: o.created_date,
            delivered_at: o.delivered_at
          })),
          pagination: { page, limit, total: orders.length },
          notes: { source: 'entities_fallback' }
        };
      } catch (fallbackError) {
        throw new Error('Erro ao listar pedidos');
      }
    }
  },

  // Seed Demo Data
  async seedDemoData() {
    try {
      const response = await base44.functions.invoke('admin_seedMarketplaceDemoData', {});
      return response.data;
    } catch (error) {
      throw new Error('Erro ao criar dados demo');
    }
  }
};