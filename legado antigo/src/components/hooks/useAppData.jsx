import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Global app data hook with intelligent caching
 * Reduces redundant API calls across the application
 */

// NOTE: This hook is deprecated and should not be used.
// This project uses custom auth via AuthProvider (authClient.apiMe).
// Keeping this stub to prevent import errors, but it always returns null.
export function useUser() {
  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      return null;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: false
  });
}

// Cache user account data
// DEPRECATED: Disabled to prevent direct entity access (violates functions-only rule)
export function useUserAccount(userId) {
  return useQuery({
    queryKey: ['userAccount', userId],
    queryFn: async () => null,
    enabled: false,
    initialData: null,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 0
  });
}

// Cache rankings with longer stale time (they don't change often)
// SAFE MODE: Disabled direct entity access to prevent 401 /entities/User/me cascade
// Returns empty rankings until proper backend function is implemented
export function useRankings() {
  return useQuery({
    queryKey: ['rankings'],
    queryFn: async () => ({
      POWER: [],
      TG: [],
      GUILDS: []
    }),
    enabled: false,
    initialData: {
      POWER: [],
      TG: [],
      GUILDS: []
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 0
  });
}

// Cache user boxes
export function useUserBoxes(boxType = 'mystery') {
  return useQuery({
    queryKey: ['userBoxes', boxType],
    queryFn: async () => {
      const functionName = boxType === 'mystery' 
        ? 'mystery_getUserBoxes'
        : 'badge_getUserLootBoxes';
      
      const res = await base44.functions.invoke(functionName);
      if (!res.data || !res.data.success) {
        throw new Error(res.data?.error || 'Erro ao carregar caixas');
      }
      return res.data.boxes || [];
    },
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2
  });
}

// Cache user collectibles (mystery rewards or badges)
export function useUserCollectibles(type = 'mystery') {
  return useQuery({
    queryKey: ['userCollectibles', type],
    queryFn: async () => {
      const functionName = type === 'mystery'
        ? 'mystery_getUserRewards'
        : 'badge_getUserBadges';
      
      const res = await base44.functions.invoke(functionName);
      if (!res.data || !res.data.success) {
        throw new Error(res.data?.error || `Erro ao carregar ${type}`);
      }
      return res.data.rewards || res.data.badges || [];
    },
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2
  });
}