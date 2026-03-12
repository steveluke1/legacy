// UI EXPORT STUB — Auth Context
// Replace with real auth (NextAuth, Clerk, Supabase, etc.)

import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(undefined);

const STUB_USER = {
  id: 'user_demo_123',
  email: 'demo@example.com',
  username: 'DemoUser',
  full_name: 'Demo User',
  role: 'user'
};

export function AuthProvider({ children }) {
  const [user] = useState(STUB_USER);
  const [isAuthenticated] = useState(true);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05070B]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Autenticação Necessária</h2>
          <p className="text-[#A9B2C7]">[STUB] Redirecionaria para /login</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}