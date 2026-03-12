import { base44 } from '@/api/base44Client';

const NEW_TOKEN_KEY = 'lon_auth_token';
const LEGACY_TOKEN_KEY = 'cz_auth_token';

export const authClient = {
  // Token management with backward compatibility
  getToken() {
    let token = localStorage.getItem(NEW_TOKEN_KEY);
    
    // Check legacy key if new key doesn't exist
    if (!token) {
      token = localStorage.getItem(LEGACY_TOKEN_KEY);
      if (token) {
        // Migrate to new key
        localStorage.setItem(NEW_TOKEN_KEY, token);
        localStorage.removeItem(LEGACY_TOKEN_KEY);
      }
    }
    
    return token;
  },

  setToken(token) {
    localStorage.setItem(NEW_TOKEN_KEY, token);
    // Remove legacy key to ensure clean migration
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  },

  clearToken() {
    localStorage.removeItem(NEW_TOKEN_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  },

  // Decode token (without verification, just for reading)
  decodeTokenSafe(token) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      return payload;
    } catch {
      return null;
    }
  },

  // API calls
  async apiRegister(data) {
    if (localStorage.admin_debug === "1") {
      console.debug('[authClient] apiRegister START', {
        email: data.email?.substring(0, 3) + '***',
        username: data.username,
        howFoundUs: data.howFoundUs
      });
    }
    
    try {
      const response = await base44.functions.invoke('auth_register', data);
      
      if (localStorage.admin_debug === "1") {
        console.debug('[authClient] apiRegister SUCCESS', {
          hasToken: !!response.data.token
        });
      }
      
      // Store token if present
      if (response.data.success && response.data.token) {
        this.setToken(response.data.token);
      }
      
      return response.data;
    } catch (error) {
      if (localStorage.admin_debug === "1") {
        console.error('[authClient] apiRegister ERROR', error);
      }
      
      // Parse error response
      const errorData = error.response?.data;
      const status = error.response?.status;
      
      if (status === 400) {
        return {
          success: false,
          error: errorData?.message_ptbr || errorData?.error || 'Dados inválidos',
          code: errorData?.code
        };
      }
      
      if (status === 500) {
        return {
          success: false,
          error: errorData?.message_ptbr || errorData?.error || 'Erro interno do servidor',
          code: errorData?.code,
          details: errorData?.details
        };
      }
      
      throw error;
    }
  },

  async apiLogin(loginId, password) {
    const requestId = Math.random().toString(36).substring(7);
    const debugMode = localStorage.getItem('DEBUG_AUTH') === '1';
    
    if (debugMode || localStorage.admin_debug === "1") {
      console.debug(`[authClient] ${requestId} - apiLogin START`, {
        loginId: loginId?.substring(0, 3) + '***'
      });
    }
    
    try {
      const payload = {
        loginId: loginId,
        password
      };
      
      if (debugMode) {
        payload.debug = true;
      }
      
      const response = await base44.functions.invoke('auth_login', payload);
      
      if (debugMode || localStorage.admin_debug === "1") {
        console.debug(`[authClient] ${requestId} - apiLogin SUCCESS`, {
          request_id: response.data?.request_id
        });
      }
      
      return response.data;
    } catch (error) {
      const errorData = error.response?.data;
      const status = error.response?.status;
      const isNetworkError = !status || status === 0;
      
      const diagnostics = {
        request_id: requestId,
        backend_request_id: errorData?.request_id,
        status: status || 0,
        isNetworkError,
        errorKey: errorData?.error || error.message,
        rawPreview: JSON.stringify(errorData || error.message).substring(0, 300),
        debug: errorData?.debug
      };
      
      if (debugMode || localStorage.admin_debug === "1") {
        console.error(`[authClient] ${requestId} - apiLogin ERROR`, diagnostics);
      }
      
      // Map status codes to PT-BR messages
      if (status === 404) {
        return {
          success: false,
          error: 'Falha ao acessar o servidor de login (rota não encontrada).',
          diagnostics
        };
      }
      
      if (status === 401) {
        return {
          success: false,
          error: errorData?.error || 'ID de login ou senha inválidos.',
          diagnostics
        };
      }
      
      if (status === 429 || status === 403) {
        return {
          success: false,
          error: errorData?.error || 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
          diagnostics
        };
      }
      
      if (status >= 500) {
        return {
          success: false,
          error: 'Serviço de autenticação indisponível. Tente novamente em instantes.',
          diagnostics
        };
      }
      
      if (isNetworkError) {
        return {
          success: false,
          error: 'Falha de conexão. Verifique sua internet e tente novamente.',
          diagnostics
        };
      }
      
      // Fallback
      return {
        success: false,
        error: errorData?.error || 'Erro ao fazer login. Tente novamente.',
        diagnostics
      };
    }
  },

  async apiMe(token) {
    const response = await base44.functions.invoke('auth_me', { token });
    return response.data;
  },

  async apiLogout(token) {
    const response = await base44.functions.invoke('auth_logout', { token });
    return response.data;
  },

  // Redirect to signup
  redirectToSignup(returnTo) {
    const url = returnTo ? `/Registrar?returnTo=${encodeURIComponent(returnTo)}` : '/Registrar';
    window.location.href = url;
  }
};