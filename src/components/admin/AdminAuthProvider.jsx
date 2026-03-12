import React, { createContext, useContext, useState, useEffect } from 'react';
import { adminClient } from '@/components/admin/adminClient';

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      initAuth();
    }
  }, [initialized]);

  const initAuth = async () => {
    try {
      const storedToken = adminClient.getToken();
      if (!storedToken) {
        setLoading(false);
        setInitialized(true);
        return;
      }

      if (localStorage.admin_debug === "1") {
        console.debug('[AdminAuthProvider] initAuth - validating stored token');
      }

      const result = await adminClient.apiMe(storedToken);
      if (result.success) {
        setToken(storedToken);
        setAdmin(result.admin);
      } else {
        if (localStorage.admin_debug === "1") {
          console.debug('[AdminAuthProvider] initAuth - token invalid, clearing');
        }
        adminClient.clearToken();
      }
    } catch (error) {
      if (localStorage.admin_debug === "1") {
        console.debug('[AdminAuthProvider] initAuth - error, clearing token');
      }
      adminClient.clearToken();
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  const login = async (email, password) => {
    try {
      if (localStorage.admin_debug === "1") {
        console.debug('[AdminAuthProvider] login() called');
      }
      
      const result = await adminClient.apiLogin(email, password);
      
      if (result.success) {
        adminClient.setToken(result.token);
        setToken(result.token);
        setAdmin(result.admin);
        return { success: true };
      } else {
        // Pass through status code and error details
        return { 
          success: false, 
          error: result.error, 
          code: result.reasonCode,
          status: result.status
        };
      }
    } catch (error) {
      if (localStorage.admin_debug === "1") {
        console.error('[AdminAuthProvider] login() error:', error);
      }
      return { 
        success: false, 
        error: error.message || 'Erro ao conectar ao servidor',
        status: error.response?.status
      };
    }
  };

  const register = async (email, username, password, inviteCode) => {
    try {
      const result = await adminClient.apiRegister(email, username, password, inviteCode);
      
      if (result.success) {
        adminClient.setToken(result.token);
        setToken(result.token);
        setAdmin(result.admin);
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: 'Erro ao conectar ao servidor' };
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await adminClient.apiLogout(token);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      adminClient.clearToken();
      setToken(null);
      setAdmin(null);
    }
  };

  const isAdminAuthenticated = !!admin && !!token;

  return (
    <AdminAuthContext.Provider value={{ admin, token, loading, login, register, logout, isAdminAuthenticated }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}