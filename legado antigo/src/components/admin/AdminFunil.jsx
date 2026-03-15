import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, UserPlus, Crown, TrendingUp, Eye, AlertTriangle, BarChart3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAdminAuth } from './AdminAuthProvider';
import { adminClient } from './adminClient';
import GlowCard from '@/components/ui/GlowCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function AdminFunil() {
  const { token } = useAdminAuth();
  const [rangeDays, setRangeDays] = useState(30);

  const { data: summary, isLoading: loadingSummary, error: errorSummary, refetch: refetchSummary } = useQuery({
    queryKey: ['admin-funnel-summary', rangeDays],
    queryFn: async () => {
      // SECURITY: adminClient.apiGetFunnelSummary uses functions with fallback
      // AnalyticsEvent is CRITICAL - if function fails, adminClient will try entities
      // This is acceptable because it has "source" indicator badge
      const response = await adminClient.apiGetFunnelSummary(token, rangeDays);
      return response;
    },
    enabled: !!token,
    staleTime: 60000,
    retry: 1,
    refetchOnWindowFocus: false
  });

  const { data: timeseries, isLoading: loadingTimeseries, refetch: refetchTimeseries } = useQuery({
    queryKey: ['admin-funnel-timeseries', rangeDays],
    queryFn: async () => {
      const response = await adminClient.apiGetFunnelTimeseries(token, rangeDays);
      return response;
    },
    enabled: !!token,
    staleTime: 60000,
    retry: 1,
    refetchOnWindowFocus: false
  });

  if (loadingSummary || !summary) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64 bg-[#19E0FF]/10" />
          <Skeleton className="h-10 w-48 bg-[#19E0FF]/10" />
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 bg-[#19E0FF]/10" />
          ))}
        </div>
        <p className="text-center text-[#A9B2C7] text-sm">Carregando dados do funil...</p>
      </div>
    );
  }

  if (errorSummary?.message?.includes('Não autorizado') || errorSummary?.message?.includes('401') || errorSummary?.message?.includes('403')) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="w-16 h-16 text-[#FF4B6A] mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Sessão expirada</h3>
        <p className="text-[#A9B2C7] mb-6">Faça login novamente para continuar</p>
        <button
          onClick={() => window.location.href = '/AdminAuth'}
          className="px-6 py-3 bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] text-[#05070B] font-bold rounded-lg hover:shadow-lg transition-all"
        >
          Ir para Login
        </button>
      </div>
    );
  }

  if (!summary?.success) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="w-16 h-16 text-[#FF4B6A] mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Erro ao carregar dados do funil</h3>
        <p className="text-[#A9B2C7] mb-6">{errorSummary?.message || 'Tente novamente mais tarde'}</p>
        <button
          onClick={() => refetchSummary()}
          className="px-6 py-3 bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] text-[#05070B] font-bold rounded-lg hover:shadow-lg transition-all"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  // Empty state check
  const funnelData = summary?.funnel || {};
  const pageViews = summary?.pageViews || [];
  const conversionRates = summary?.conversionRates || {};
  const hasData = funnelData.visits_unique > 0 || funnelData.signup_view_unique > 0;
  
  if (!hasData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Funil de Conversão</h2>
            {summary?.notes?.source === 'entities' && (
              <p className="text-xs text-blue-400 mt-1">
                • Modo compatível: dados carregados diretamente do banco
              </p>
            )}
          </div>
          <Select value={String(rangeDays)} onValueChange={(val) => setRangeDays(Number(val))}>
            <SelectTrigger className="w-48 bg-[#0C121C] border-[#19E0FF]/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-center py-16">
          <BarChart3 className="w-16 h-16 text-[#A9B2C7]/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Nenhum dado encontrado no período selecionado</h3>
          <p className="text-[#A9B2C7]">
            Tente ampliar o período ou aguarde novos acessos
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Funil de Conversão</h2>
          {summary?.notes?.source === 'entities' && (
            <p className="text-xs text-blue-400 mt-1">
              • Modo compatível: dados carregados diretamente do banco
            </p>
          )}
        </div>
        <Select value={String(rangeDays)} onValueChange={(val) => setRangeDays(Number(val))}>
          <SelectTrigger className="w-48 bg-[#0C121C] border-[#19E0FF]/20 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards - Funnel Stages */}
      <div className="grid md:grid-cols-4 gap-6">
        <GlowCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#19E0FF]/20 rounded-lg flex items-center justify-center">
              <Eye className="w-6 h-6 text-[#19E0FF]" />
            </div>
            <div>
              <p className="text-[#A9B2C7] text-sm">Visitas</p>
              <p className="text-2xl font-bold text-white">{funnelData.visits_unique}</p>
              <p className="text-xs text-[#A9B2C7]">{funnelData.visits_total} pageviews</p>
            </div>
          </div>
        </GlowCard>

        <GlowCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#F7CE46]/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-[#F7CE46]" />
            </div>
            <div>
              <p className="text-[#A9B2C7] text-sm">Viram Cadastro</p>
              <p className="text-2xl font-bold text-white">{funnelData.signup_view_unique}</p>
              <p className="text-xs text-[#10B981]">
                {conversionRates.visit_to_signup_view?.toFixed(1) || '0'}% das visitas
              </p>
            </div>
          </div>
        </GlowCard>

        <GlowCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#10B981]/20 rounded-lg flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-[#10B981]" />
            </div>
            <div>
              <p className="text-[#A9B2C7] text-sm">Concluíram Cadastro</p>
              <p className="text-2xl font-bold text-white">{funnelData.signup_complete_unique}</p>
              <p className="text-xs text-[#10B981]">
                {conversionRates.signup_view_to_signup_complete?.toFixed(1) || '0'}% dos que viram
              </p>
            </div>
          </div>
        </GlowCard>

        <GlowCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#FF4B6A]/20 rounded-lg flex items-center justify-center">
              <Crown className="w-6 h-6 text-[#FF4B6A]" />
            </div>
            <div>
              <p className="text-[#A9B2C7] text-sm">Compraram Premium</p>
              <p className="text-2xl font-bold text-white">{funnelData.premium_purchase_unique}</p>
              <p className="text-xs text-[#10B981]">
                {conversionRates.signup_complete_to_premium_purchase?.toFixed(1) || '0'}% dos cadastrados
              </p>
            </div>
          </div>
        </GlowCard>
      </div>

      {/* Additional Metrics */}
      <div className="grid md:grid-cols-2 gap-6">
        <GlowCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#19E0FF]/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#19E0FF]" />
            </div>
            <div>
              <p className="text-[#A9B2C7] text-sm">Negociaram ALZ</p>
              <p className="text-2xl font-bold text-white">{funnelData.alz_trade_unique}</p>
              <p className="text-xs text-[#10B981]">
                {conversionRates.signup_complete_to_alz_trade?.toFixed(1) || '0'}% dos cadastrados
              </p>
            </div>
          </div>
        </GlowCard>

        <GlowCard className="p-6">
          <div className="space-y-2">
            <p className="text-[#A9B2C7] text-sm font-semibold">Taxa de Ativação</p>
            <p className="text-3xl font-bold text-white">
              {((funnelData.premium_purchase_unique + funnelData.alz_trade_unique) / Math.max(funnelData.signup_complete_unique, 1) * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-[#A9B2C7]">
              Usuários cadastrados que compram Premium ou negociam ALZ
            </p>
          </div>
        </GlowCard>
      </div>

      {/* Timeseries Chart */}
      {!loadingTimeseries && timeseries?.success && (
        <GlowCard className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">Evolução do Funil</h3>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={timeseries.timeseries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#19E0FF20" />
              <XAxis 
                dataKey="date" 
                stroke="#A9B2C7"
                tickFormatter={(val) => new Date(val).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              />
              <YAxis stroke="#A9B2C7" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0C121C', border: '1px solid #19E0FF40', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Line type="monotone" dataKey="visits" stroke="#19E0FF" strokeWidth={2} name="Visitas" />
              <Line type="monotone" dataKey="signup_view" stroke="#F7CE46" strokeWidth={2} name="Viram Cadastro" />
              <Line type="monotone" dataKey="signup_complete" stroke="#10B981" strokeWidth={2} name="Completaram Cadastro" />
              <Line type="monotone" dataKey="premium_purchase" stroke="#FF4B6A" strokeWidth={2} name="Compraram Premium" />
              <Line type="monotone" dataKey="alz_trade" stroke="#A9B2C7" strokeWidth={2} name="Negociaram ALZ" />
            </LineChart>
          </ResponsiveContainer>
        </GlowCard>
      )}

      {/* Page Access Table */}
      <GlowCard className="p-6">
        <h3 className="text-lg font-bold text-white mb-4">Acessos por Aba</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#19E0FF]/20">
                <th className="text-left py-3 px-4 text-[#A9B2C7] font-semibold">Página</th>
                <th className="text-right py-3 px-4 text-[#A9B2C7] font-semibold">Acessos</th>
                <th className="text-right py-3 px-4 text-[#A9B2C7] font-semibold">Usuários Únicos</th>
              </tr>
            </thead>
            <tbody>
              {pageViews.slice(0, 15).map((page, index) => (
                <motion.tr
                  key={page.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="border-b border-[#19E0FF]/10 hover:bg-[#19E0FF]/5"
                >
                  <td className="py-3 px-4 text-white font-medium">{page.name}</td>
                  <td className="py-3 px-4 text-right text-white">{page.total}</td>
                  <td className="py-3 px-4 text-right text-[#19E0FF]">{page.unique}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlowCard>
    </div>
  );
}