import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function useRankingCorredores() {
  const { data, isLoading, error, isSuccess } = useQuery({
    queryKey: ['rankings-current'],
    queryFn: async () => {
      const response = await base44.functions.invoke('rankingsGetCurrent');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  const available = data?.data?.available !== false;
  const corredoresData = data?.data?.corredores || {};
  const top3 = corredoresData.top3 || [];
  const ranking = corredoresData.topN || [];
  const weekRange = corredoresData.periodLabel || 'Carregando...';
  const prizes = corredoresData.prizes || [
    { place: 1, color: '#FFD700', value: 'R$ 500,00' },
    { place: 2, color: '#C0C0C0', value: 'R$ 250,00' },
    { place: 3, color: '#CD7F32', value: 'R$ 100,00' },
    { place: 4, color: '#A9B2C7', value: 'R$ 50,00' },
    { place: 5, color: '#A9B2C7', value: 'R$ 25,00' }
  ];

  return {
    available,
    ranking,
    top3,
    prizes,
    weekRange,
    isLoading,
    error,
    success: isSuccess
  };
}


export function useRankingMatador() {
  const { data, isLoading, error, isSuccess } = useQuery({
    queryKey: ['rankings-current'],
    queryFn: async () => {
      const response = await base44.functions.invoke('rankingsGetCurrent');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  const available = data?.data?.available !== false;
  const matadorData = data?.data?.matador || {};
  const top3 = matadorData.top3 || [];
  const ranking = matadorData.topN || [];
  const periodLabel = matadorData.periodLabel || 'Carregando...';
  const prizes = matadorData.prizes || [
    { place: 1, color: '#FFD700', value: '10.000 CASH' },
    { place: 2, color: '#C0C0C0', value: '5.000 CASH' },
    { place: 3, color: '#CD7F32', value: '1.500 CASH' },
    { place: 4, color: '#A9B2C7', value: '1.000 CASH' },
    { place: 5, color: '#A9B2C7', value: '500 CASH' }
  ];

  return {
    available,
    ranking,
    top3,
    prizes,
    periodLabel,
    isLoading,
    error,
    success: isSuccess
  };
}