import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '@/components/analytics/analyticsClient';

const PAGE_NAMES = {
  '/': 'Início',
  '/home': 'Início',
  '/ranking': 'Ranking',
  '/enquetes': 'Enquetes',
  '/loja': 'Loja',
  '/wiki': 'Wiki',
  '/guildas': 'Guildas',
  '/tg-ao-vivo': 'TG ao Vivo',
  '/mercado': 'Mercado',
  '/suporte': 'Suporte',
  '/painel': 'Painel',
  '/minha-conta': 'Minha Conta',
  '/login': 'Login',
  '/registrar': 'Cadastro'
};

export default function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const pageName = PAGE_NAMES[path] || path.split('/')[1] || 'Página';
    
    // Track page view
    trackPageView(path, pageName);
  }, [location]);

  return null;
}