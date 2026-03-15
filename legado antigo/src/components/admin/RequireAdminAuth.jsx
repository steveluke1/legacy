import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAdminAuth } from '@/components/admin/AdminAuthProvider';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function RequireAdminAuth({ children }) {
  const { isAdminAuthenticated, loading } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isAuthPage = location.pathname === createPageUrl('AdminAuth') || 
                       location.pathname === createPageUrl('AdminLogin');
    
    if (!loading && !isAdminAuthenticated && !isAuthPage) {
      if (localStorage.admin_debug === "1") {
        console.debug('[RequireAdminAuth] Redirecting to AdminAuth (not authenticated)');
      }
      const fromUrl = location.pathname + location.search;
      navigate(createPageUrl('AdminAuth') + `?from_url=${encodeURIComponent(fromUrl)}`);
    }
  }, [loading, isAdminAuthenticated, navigate, location]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05070B]">
        <LoadingSpinner size="lg" text="Verificando autenticação..." />
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return null;
  }

  return <>{children}</>;
}