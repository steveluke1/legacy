import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      
      if (!isAuth) {
        // Redirect to login with from_url parameter
        const currentPath = location.pathname + location.search;
        navigate(createPageUrl('Login') + `?from_url=${encodeURIComponent(currentPath)}`);
      } else {
        setIsAuthenticated(true);
      }
    } catch (error) {
      // If error checking auth, assume not authenticated
      const currentPath = location.pathname + location.search;
      navigate(createPageUrl('Login') + `?from_url=${encodeURIComponent(currentPath)}`);
    } finally {
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#19E0FF] animate-spin mx-auto mb-4" />
          <p className="text-[#A9B2C7]">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}