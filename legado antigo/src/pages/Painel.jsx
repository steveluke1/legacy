// PÁGINA REMOVIDA - Use /MinhaConta
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Painel() {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate(createPageUrl('MinhaConta'), { replace: true });
  }, [navigate]);
  
  return null;
}