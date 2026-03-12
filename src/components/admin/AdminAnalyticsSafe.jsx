import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Users, Activity, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAdminAuth } from './AdminAuthProvider';
import { adminClient } from './adminClient';
import GlowCard from '@/components/ui/GlowCard';
import { Skeleton } from '@/components/ui/skeleton';
import SecureFunctionUnavailable from './SecureFunctionUnavailable';

/**
 * SAFE VERSION: Uses admin-protected functions only
 * No direct entity access to AnalyticsEvent (CRITICAL)
 */
export default function AdminAnalyticsSafe() {
  const { token } = useAdminAuth();

  const { data: analyticsData, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-analytics-safe'],
    queryFn: async () => {
      // SECURITY: Use function only, no entity fallback
      try {
        const response = await adminClient.apiGetAnalyticsSummary(token, 30);
        return response;
      } catch (error) {
        // If function not found (404), throw specific error
        if (error.response?.status === 404 || error.message?.includes('404')) {
          throw new Error('SECURE_FUNCTION_UNAVAILABLE');
        }
        throw error;
      }
    },
    enabled: !!token,
    staleTime: 60000,
    retry: 1,
    refetchOnWindowFocus: false
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 bg-[#19E0FF]/10" />
        <div className="grid md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 bg-[#19E0FF]/10" />
          ))}
        </div>
        <p className="text-center text-[#A9B2C7] text-sm">Carregando analytics...</p>
      </div>
    );
  }

  // FAIL-CLOSED: If function unavailable, show security message
  if (error?.message === 'SECURE_FUNCTION_UNAVAILABLE') {
    return (
      <SecureFunctionUnavailable 
        onGoToRBAC={() => {
          const event = new CustomEvent('changeAdminTab', { detail: { tab: 'security' } });
          window.dispatchEvent(event);
        }}
      />
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="w-16 h-16 text-[#FF4B6A] mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Erro ao carregar analytics</h3>
        <p className="text-[#A9B2C7] mb-6">{error.message}</p>
        <button
          onClick={() => refetch()}
          className="px-6 py-3 bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] text-[#05070B] font-bold rounded-lg hover:shadow-lg transition-all"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  const summary = analyticsData?.summary || {};

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Analytics (Seguro)</h2>

      <div className="grid md:grid-cols-4 gap-6">
        <GlowCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#19E0FF]/20 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-[#19E0FF]" />
            </div>
            <div>
              <p className="text-[#A9B2C7] text-sm">Eventos (30d)</p>
              <p className="text-2xl font-bold text-white">{summary.total_events || 0}</p>
            </div>
          </div>
        </GlowCard>

        <GlowCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#10B981]/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-[#10B981]" />
            </div>
            <div>
              <p className="text-[#A9B2C7] text-sm">Usuários Únicos</p>
              <p className="text-2xl font-bold text-white">{summary.unique_users || 0}</p>
            </div>
          </div>
        </GlowCard>

        <GlowCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#F7CE46]/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#F7CE46]" />
            </div>
            <div>
              <p className="text-[#A9B2C7] text-sm">Conversões</p>
              <p className="text-2xl font-bold text-white">{summary.conversions || 0}</p>
            </div>
          </div>
        </GlowCard>

        <GlowCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#9146FF]/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-[#9146FF]" />
            </div>
            <div>
              <p className="text-[#A9B2C7] text-sm">Taxa Conversão</p>
              <p className="text-2xl font-bold text-white">
                {summary.conversion_rate ? `${summary.conversion_rate}%` : '0%'}
              </p>
            </div>
          </div>
        </GlowCard>
      </div>

      <div className="p-4 bg-[#10B981]/10 border border-[#10B981]/30 rounded-lg">
        <p className="text-[#10B981] text-sm">
          🛡️ <strong>Segurança Ativa:</strong> Esta página usa funções admin-protegidas. 
          Dados de AnalyticsEvent não são acessados diretamente do navegador.
        </p>
      </div>
    </div>
  );
}