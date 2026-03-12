import React, { createContext, useContext, useState, useEffect } from 'react';
import { authClient } from './authClient';
import { toast } from 'sonner';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On app start, check if we have a token
    initAuth();
  }, []);

  const initAuth = async () => {
    const storedToken = authClient.getToken();
    if (!storedToken) {
      setLoading(false);
      return;
    }

    try {
      const response = await authClient.apiMe(storedToken);
      if (response.success) {
        setUser(response.user);
        setToken(storedToken);
      } else {
        authClient.clearToken();
      }
    } catch (e) {
      authClient.clearToken();
    } finally {
      setLoading(false);
    }
  };

  const login = async ({ loginId, password }) => {
    try {
      const response = await authClient.apiLogin(loginId, password);
      if (response.success) {
        authClient.setToken(response.token);
        setToken(response.token);
        setUser(response.user);
        return { success: true };
      } else {
        return { success: false, error: response.error, diagnostics: response.diagnostics };
      }
    } catch (error) {
      return { success: false, error: 'Erro ao fazer login' };
    }
  };

  const register = async (data) => {
    if (localStorage.admin_debug === "1") {
      console.debug('[AuthProvider] register() called');
    }
    
    try {
      const response = await authClient.apiRegister(data);
      if (response.success) {
        if (localStorage.admin_debug === "1") {
          console.debug('[AuthProvider] register() success');
        }
        return { success: true, user: response.user };
      } else {
        if (localStorage.admin_debug === "1") {
          console.debug('[AuthProvider] register() failed:', response.error);
        }
        return { success: false, error: response.error || 'Erro ao criar conta' };
      }
    } catch (error) {
      if (localStorage.admin_debug === "1") {
        console.error('[AuthProvider] register() exception:', error);
      }
      return { 
        success: false, 
        error: error.message || 'Erro ao conectar ao servidor. Tente novamente.' 
      };
    }
  };

  const logout = async () => {
    const currentToken = authClient.getToken();
    if (currentToken) {
      try {
        await authClient.apiLogout(currentToken);
      } catch (e) {
        // Ignore errors on logout
      }
    }
    
    authClient.clearToken();
    setToken(null);
    setUser(null);
    toast.success('Você saiu da sua conta.');
  };

  const refreshSession = async () => {
    const storedToken = authClient.getToken();
    if (!storedToken) {
      setUser(null);
      setToken(null);
      return false;
    }

    try {
      const response = await authClient.apiMe(storedToken);
      if (response.success) {
        setUser(response.user);
        setToken(storedToken);
        return true;
      } else {
        authClient.clearToken();
        setUser(null);
        setToken(null);
        return false;
      }
    } catch (e) {
      authClient.clearToken();
      setUser(null);
      setToken(null);
      return false;
    }
  };

  const value = React.useMemo(() => ({
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshSession
  }), [user, token, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}