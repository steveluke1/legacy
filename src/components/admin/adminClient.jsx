import { base44 } from '@/api/base44Client';
import { buildOverviewFromEntities } from './overviewData';
import { fetchAdminData } from './adminDataGateway';

const NEW_ADMIN_TOKEN_KEY = 'lon_admin_token';
const LEGACY_ADMIN_TOKEN_KEY = 'cz_admin_token';

export const adminClient = {
  getToken() {
    let token = localStorage.getItem(NEW_ADMIN_TOKEN_KEY);
    
    // Check legacy key if new key doesn't exist
    if (!token) {
      token = localStorage.getItem(LEGACY_ADMIN_TOKEN_KEY);
      if (token) {
        // Migrate to new key
        localStorage.setItem(NEW_ADMIN_TOKEN_KEY, token);
        localStorage.removeItem(LEGACY_ADMIN_TOKEN_KEY);
      }
    }
    
    return token;
  },

  setToken(token) {
    localStorage.setItem(NEW_ADMIN_TOKEN_KEY, token);
    // Remove legacy key to ensure clean migration
    localStorage.removeItem(LEGACY_ADMIN_TOKEN_KEY);
  },

  clearToken() {
    localStorage.removeItem(NEW_ADMIN_TOKEN_KEY);
    localStorage.removeItem(LEGACY_ADMIN_TOKEN_KEY);
  },

  async apiLogin(email, password) {
    const correlationId = crypto.randomUUID();
    
    if (localStorage.admin_debug === "1") {
      console.debug(`[adminClient] apiLogin START correlationId=${correlationId}`);
    }
    
    try {
      const response = await base44.functions.invoke('adminLogin', {
        email,
        password
      });
      
      if (localStorage.admin_debug === "1") {
        console.debug(`[adminClient] apiLogin SUCCESS correlationId=${correlationId}`);
      }
      
      return {
        ...response.data,
        status: response.status
      };
    } catch (error) {
      if (localStorage.admin_debug === "1") {
        console.debug(`[adminClient] apiLogin ERROR correlationId=${correlationId} status=${error.response?.status}`);
      }
      
      // Parse error response
      const errorData = error.response?.data;
      const status = error.response?.status;
      
      if (status === 429) {
        return {
          success: false,
          error: errorData?.message_ptbr || errorData?.error || 'Muitas tentativas. Aguarde.',
          code: errorData?.code || 'RATE_LIMITED',
          status: 429,
          retryAfterSeconds: errorData?.retry_after_seconds || 20
        };
      }
      
      if (status === 401) {
        return {
          success: false,
          error: errorData?.message_ptbr || errorData?.error || 'Usuário ou senha inválidos.',
          code: errorData?.code || 'INVALID_CREDENTIALS',
          status: 401
        };
      }
      
      if (status === 403) {
        return {
          success: false,
          error: errorData?.message_ptbr || errorData?.error || 'Acesso negado.',
          code: errorData?.code || 'FORBIDDEN',
          status: 403
        };
      }
      
      // Other errors
      throw error;
    }
  },

  async apiMe(token) {
    const response = await base44.functions.invoke('adminMe', { token });
    return response.data;
  },

  async apiLogout(token) {
    const response = await base44.functions.invoke('adminLogout', { token });
    return response.data;
  },

  async apiRegister(email, username, password, inviteCode) {
    const response = await base44.functions.invoke('adminRegister', {
      email,
      username,
      password,
      inviteCode
    });
    return response.data;
  },

  async apiGetOverview(adminToken, range = '30d', from = null, to = null) {
    const token = this.getToken();
    if (!token) throw new Error('Não autorizado');

    // Try multiple endpoints in priority order (aliasing strategy)
    const endpoints = [
      '/api/admin_getOverview',
      '/api/adminGetOverview',
      '/api/admin_get_overview'
    ];

    const body = JSON.stringify({ range, from, to });
    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        console.log(`[adminClient] Trying endpoint: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body
        });

        // If 404, try next endpoint
        if (response.status === 404) {
          console.warn(`[adminClient] ${endpoint} returned 404, trying next...`);
          continue;
        }

        // Read response as text
        const responseText = await response.text();
        
        // If empty, try next endpoint
        if (!responseText || responseText.trim() === '') {
          console.warn(`[adminClient] ${endpoint} returned empty body, trying next...`);
          continue;
        }

        // Try to parse JSON
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.warn(`[adminClient] ${endpoint} returned invalid JSON, trying next...`);
          continue;
        }

        // If 401/403, throw immediately (auth issue, not endpoint issue)
        if (response.status === 401 || response.status === 403) {
          const errorMsg = data.error || 'Não autorizado. Faça login novamente.';
          throw new Error(errorMsg);
        }

        // If response is ok and data is valid, return it
        if (response.ok && data.success !== false) {
          console.log(`[adminClient] Success with endpoint: ${endpoint}`);
          return data;
        }

        // If we got here, response had error but wasn't 404/empty/unparseable
        lastError = new Error(data.error || `Erro no servidor (${response.status})`);
        
      } catch (fetchError) {
        if (fetchError.message.includes('Não autorizado')) {
          throw fetchError; // Re-throw auth errors immediately
        }
        console.warn(`[adminClient] ${endpoint} failed:`, fetchError.message);
        lastError = fetchError;
      }
    }

    // All endpoints failed
    console.error('[adminClient] All Overview endpoints failed');
    throw new Error(lastError?.message || 'Visão Geral indisponível no servidor. Tente novamente em instantes.');
  },

  async apiGetOverviewRobust(range = '30d', from = null, to = null) {
    const token = this.getToken();
    if (!token) throw new Error('Não autorizado');

    // Try function endpoints first
    try {
      const data = await this.apiGetOverview(token, range, from, to);
      return data;
    } catch (functionError) {
      // If auth error, don't fallback
      if (functionError.message.includes('Não autorizado')) {
        throw functionError;
      }

      // Function endpoints failed, fallback to entities
      console.log('[adminClient] Function endpoints failed, falling back to entities');
      
      try {
        const data = await buildOverviewFromEntities({ range, from, to });
        return data;
      } catch (entitiesError) {
        console.error('[adminClient] Entities fallback also failed:', entitiesError);
        throw new Error('Não foi possível carregar os dados da Visão Geral.');
      }
    }
  },

  async apiListEnquetes(adminToken, search = '', status = 'all', sort = 'newest') {
    const response = await base44.functions.invoke('adminListEnquetes', {
      adminToken,
      search,
      status,
      sort
    });
    return response;
  },

  async apiCreateEnquete(adminToken, enqueteData) {
    const response = await base44.functions.invoke('adminCreateEnquete', {
      adminToken,
      ...enqueteData
    });
    return response;
  },

  async apiUpdateEnquete(adminToken, id, patch) {
    const response = await base44.functions.invoke('adminUpdateEnquete', {
      adminToken,
      id,
      patch
    });
    return response;
  },

  async apiDeleteEnquete(adminToken, id, hardDelete = false) {
    const response = await base44.functions.invoke('adminDeleteEnquete', {
      adminToken,
      id,
      hardDelete
    });
    return response;
  },

  async apiGetStoreSales(adminToken, limit = 100, days = 30) {
    const token = this.getToken();
    return await fetchAdminData({
      key: 'storeSales',
      params: { limit, days },
      token
    });
  },

  async apiGetFunnelSummary(adminToken, rangeDays = 30) {
    const token = this.getToken();
    return await fetchAdminData({
      key: 'funnelSummary',
      params: { rangeDays },
      token
    });
  },

  async apiGetFunnelTimeseries(adminToken, rangeDays = 30) {
    const token = this.getToken();
    return await fetchAdminData({
      key: 'funnelTimeseries',
      params: { rangeDays },
      token
    });
  },

  async createStreamerPackage(packageData) {
    const token = this.getToken();
    if (!token) throw new Error('Não autorizado');

    // Call backend function ONLY (no entity fallback)
    const response = await fetch('/api/admin_createStreamerPackage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(packageData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Erro ao criar pacote');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Erro ao criar pacote');
    }

    return data;
  },

  async listStreamerPackages(includeInactive = true) {
    const token = this.getToken();
    return await fetchAdminData({
      key: 'streamerPackages',
      params: { includeInactive },
      token
    });
  },

  async toggleStreamerPackageActive(packageId, isActive) {
    const token = this.getToken();
    if (!token) throw new Error('Não autorizado');

    // Call backend function ONLY (no entity fallback)
    const response = await fetch('/api/admin_toggleStreamerPackageActive', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ packageId, isActive })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Erro ao atualizar pacote');
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Erro ao atualizar pacote');
    }

    return data;
  },

  async apiListAccounts(adminToken, q = '', page = 1, pageSize = 20) {
    const token = this.getToken();
    return await fetchAdminData({
      key: 'accounts',
      params: { q, page, pageSize },
      token
    });
  },

  async apiListEnquetes(adminToken, search = '', status = 'all', sort = 'newest') {
    const token = this.getToken();
    return await fetchAdminData({
      key: 'enquetes',
      params: { search, status, sort, operation: 'list' },
      token
    });
  },

  async apiCreateEnquete(adminToken, enqueteData) {
    const token = this.getToken();
    return await fetchAdminData({
      key: 'enquetes',
      params: { ...enqueteData, operation: 'create' },
      token
    });
  },

  async apiUpdateEnquete(adminToken, id, patch) {
    const token = this.getToken();
    return await fetchAdminData({
      key: 'enquetes',
      params: { id, patch, operation: 'update' },
      token
    });
  },

  async apiDeleteEnquete(adminToken, id, hardDelete = false) {
    const token = this.getToken();
    return await fetchAdminData({
      key: 'enquetes',
      params: { id, hardDelete, operation: 'delete' },
      token
    });
  }
};