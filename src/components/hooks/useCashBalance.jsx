import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export const CASH_BALANCE_QUERY_KEY = 'cashBalance';

export function useCashBalance(userId, enabled = true) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [CASH_BALANCE_QUERY_KEY, userId],
    queryFn: async () => {
      // Get token from localStorage for custom auth
      const token = localStorage.getItem('lon_auth_token');
      if (!token) {
        return null;
      }

      const response = await base44.functions.invoke('walletGetUserAccount', { token });
      if (response.data?.success) {
        return response.data.account;
      }
      return null;
    },
    enabled: enabled && !!userId,
    staleTime: 30000,
    retry: 1
  });

  const invalidateBalance = () => {
    queryClient.invalidateQueries({ queryKey: [CASH_BALANCE_QUERY_KEY, userId] });
  };

  const refetchBalance = () => {
    return query.refetch();
  };

  return {
    ...query,
    invalidateBalance,
    refetchBalance
  };
}