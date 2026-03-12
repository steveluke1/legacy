import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import LoadingShell from '@/components/ui/LoadingShell';

export default function MinhaContaExtensores() {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate(createPageUrl('MinhaConta'), { replace: true });
  }, [navigate]);
  
  return <LoadingShell message="Redirecionando..." fullScreen={false} />;
}