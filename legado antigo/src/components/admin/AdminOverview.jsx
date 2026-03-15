import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, User, Shield, Activity, DollarSign, Package, TrendingUp, ShoppingCart, AlertCircle, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAdminAuth } from './AdminAuthProvider';
import { adminClient } from './adminClient';
import GlowCard from '@/components/ui/GlowCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function AdminOverview() {
  const { token } = useAdminAuth();
  const [range, setRange] = useState('30d');

  const { data: overview, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-overview', range],
    queryFn: async () => {
      const response = await adminClient.apiGetOverviewRobust(range);
      return response;
    },
    enabled: !!token,
    staleTime: 60000,
    retry: 1,
    refetchOnWindowFocus: false
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 bg-[#19E0FF]/10" />
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-32 bg-[#19E0FF]/10" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !overview?.success) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-16 h-16 text-[#FF4B6A] mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Não foi possível carregar a Visão Geral</h3>
        <p className="text-[#A9B2C7] mb-4">{error?.message || 'Tente novamente mais tarde'}</p>
        <button
          onClick={() => refetch()}
          className="px-6 py-2 bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] text-[#05070B] font-bold rounded-lg hover:shadow-lg transition-all"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  const kpis = overview.kpis || {};
  const vipByPlan = overview.vipByPlan || [];
  const boxesByType = overview.boxesByType || [];
  const alzMarket = overview.alzMarket || {};
  const recentEvents = overview.recentCommerceEvents || [];
  const notes = overview.notes || {};

  const rangeLabels = {
    '7d': 'Últimos 7 dias',
    '30d': 'Últimos 30 dias',
    '90d': 'Últimos 90 dias',
    'this_month': 'Este mês'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Visão Geral Executiva</h2>
          {overview?.source === 'EntitiesDirect' && (
            <p className="text-xs text-blue-400 mt-1">
              • Modo compatível: dados carregados diretamente do banco
            </p>
          )}
        </div>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-48 bg-[#0C121C] border-[#19E0FF]/20 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#0C121C] border-[#19E0FF]/20">
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
            <SelectItem value="90d">Últimos 90 dias</SelectItem>
            <SelectItem value="this_month">Este mês</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Data Quality Warning */}
      {notes.dataQuality === 'partial' && notes.missingInstrumentation?.length > 0 && (
        <div className="bg-[#F7CE46]/10 border border-[#F7CE46]/30 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#F7CE46] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[#F7CE46] font-semibold text-sm mb-1">Instrumentação incompleta</p>
            <p className="text-[#F7CE46]/80 text-xs">
              Sem eventos: {notes.missingInstrumentation.join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <GlowCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#19E0FF]/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-[#19E0FF]" />
              </div>
              <div>
                <p className="text-[#A9B2C7] text-sm">Contas Total</p>
                <p className="text-2xl font-bold text-white">{kpis.totalAccounts?.toLocaleString() || '0'}</p>
              </div>
            </div>
          </GlowCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <GlowCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#F7CE46]/20 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-[#F7CE46]" />
              </div>
              <div>
                <p className="text-[#A9B2C7] text-sm">Personagens</p>
                <p className="text-2xl font-bold text-white">{kpis.totalCharacters?.toLocaleString() || '0'}</p>
              </div>
            </div>
          </GlowCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <GlowCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#9146FF]/20 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-[#9146FF]" />
              </div>
              <div>
                <p className="text-[#A9B2C7] text-sm">Guildas</p>
                <p className="text-2xl font-bold text-white">{kpis.totalGuilds?.toLocaleString() || '0'}</p>
              </div>
            </div>
          </GlowCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <GlowCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#10B981]/20 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-[#10B981]" />
              </div>
              <div>
                <p className="text-[#A9B2C7] text-sm">Online Agora</p>
                <p className="text-2xl font-bold text-white">{kpis.onlineNow?.toLocaleString() || '0'}</p>
              </div>
            </div>
          </GlowCard>
        </motion.div>

        {/* Commerce KPIs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <GlowCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#FFD700]/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[#FFD700]" />
              </div>
              <div>
                <p className="text-[#A9B2C7] text-sm">VIP Vendidos ({rangeLabels[range]})</p>
                <p className="text-2xl font-bold text-white">R$ {kpis.totalVipSoldBrl?.toFixed(2) || '0.00'}</p>
                <p className="text-[#A9B2C7] text-xs">{kpis.totalVipSoldCount || 0} vendas</p>
              </div>
            </div>
          </GlowCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <GlowCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#FF4B6A]/20 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-[#FF4B6A]" />
              </div>
              <div>
                <p className="text-[#A9B2C7] text-sm">Caixas Vendidas ({rangeLabels[range]})</p>
                <p className="text-2xl font-bold text-white">R$ {kpis.totalBoxesSoldBrl?.toFixed(2) || '0.00'}</p>
                <p className="text-[#A9B2C7] text-xs">{kpis.totalBoxesSoldCount || 0} vendas</p>
              </div>
            </div>
          </GlowCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <GlowCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#19E0FF]/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#19E0FF]" />
              </div>
              <div>
                <p className="text-[#A9B2C7] text-sm">Vol. Mercado ALZ ({rangeLabels[range]})</p>
                <p className="text-2xl font-bold text-white">R$ {kpis.alzMarketTotalBrlVolume?.toFixed(2) || '0.00'}</p>
                <p className="text-[#A9B2C7] text-xs">{kpis.alzMarketTotalOrders || 0} pedidos</p>
              </div>
            </div>
          </GlowCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <GlowCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#9146FF]/20 rounded-lg flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-[#9146FF]" />
              </div>
              <div>
                <p className="text-[#A9B2C7] text-sm">Ticket Médio ALZ</p>
                <p className="text-2xl font-bold text-white">R$ {kpis.alzMarketAvgTicketBrl?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </GlowCard>
        </motion.div>
      </div>

      {/* Sales Breakdown */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* VIP Sales */}
        <GlowCard className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">Vendas de Premium/VIP</h3>
          {vipByPlan.length > 0 ? (
            <div className="space-y-3">
              {vipByPlan.map((plan, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-[#05070B] rounded-lg">
                  <div className="flex-1">
                    <p className="text-white font-semibold">{plan.name || plan.productKey}</p>
                    <p className="text-[#A9B2C7] text-xs">{plan.soldCount} vendas</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#19E0FF] font-bold">R$ {plan.totalBrl?.toFixed(2) || '0.00'}</p>
                    {plan.totalCash > 0 && (
                      <p className="text-[#F7CE46] text-xs">{plan.totalCash} CASH</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-[#A9B2C7]/30 mx-auto mb-2" />
              <p className="text-[#A9B2C7] text-sm">Nenhuma venda de VIP no período</p>
            </div>
          )}
        </GlowCard>

        {/* Box Sales */}
        <GlowCard className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">Vendas de Caixas/Pacotes</h3>
          {boxesByType.length > 0 ? (
            <div className="space-y-3">
              {boxesByType.map((box, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-[#05070B] rounded-lg">
                  <div className="flex-1">
                    <p className="text-white font-semibold">{box.name || box.productKey}</p>
                    <p className="text-[#A9B2C7] text-xs">{box.soldCount} vendas</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#FF4B6A] font-bold">R$ {box.totalBrl?.toFixed(2) || '0.00'}</p>
                    {box.totalCash > 0 && (
                      <p className="text-[#F7CE46] text-xs">{box.totalCash} CASH</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-[#A9B2C7]/30 mx-auto mb-2" />
              <p className="text-[#A9B2C7] text-sm">Nenhuma venda de caixa no período</p>
            </div>
          )}
        </GlowCard>
      </div>

      {/* ALZ Market Analytics */}
      <GlowCard className="p-6">
        <h3 className="text-lg font-bold text-white mb-4">Volume do Mercado de ALZ (BRL)</h3>
        {alzMarket.volumeBrlSeries?.length > 0 ? (
          <div className="space-y-6">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={alzMarket.volumeBrlSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#19E0FF20" />
                <XAxis 
                  dataKey="date" 
                  stroke="#A9B2C7"
                  tick={{ fill: '#A9B2C7', fontSize: 12 }}
                  tickFormatter={(val) => new Date(val).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                />
                <YAxis stroke="#A9B2C7" tick={{ fill: '#A9B2C7', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0C121C', border: '1px solid #19E0FF40' }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(value) => [`R$ ${value.toFixed(2)}`, 'Volume']}
                />
                <Line type="monotone" dataKey="valueBrl" stroke="#19E0FF" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>

            {/* Top Sellers and Buyers */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-white font-semibold mb-3">Top 5 Vendedores</h4>
                <div className="space-y-2">
                  {alzMarket.topSellers?.slice(0, 5).map((seller, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-[#05070B] rounded">
                      <span className="text-[#A9B2C7] text-sm">{seller.displayName.substring(0, 12)}...</span>
                      <span className="text-[#19E0FF] font-bold text-sm">R$ {seller.totalBrl?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-3">Top 5 Compradores</h4>
                <div className="space-y-2">
                  {alzMarket.topBuyers?.slice(0, 5).map((buyer, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-[#05070B] rounded">
                      <span className="text-[#A9B2C7] text-sm">{buyer.displayName.substring(0, 12)}...</span>
                      <span className="text-[#19E0FF] font-bold text-sm">R$ {buyer.totalBrl?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-[#A9B2C7]/30 mx-auto mb-2" />
            <p className="text-[#A9B2C7] text-sm">Sem transações de ALZ no período</p>
          </div>
        )}
      </GlowCard>

      {/* Recent Activity */}
      <GlowCard className="p-6">
        <h3 className="text-lg font-bold text-white mb-4">Atividade Recente</h3>
        {recentEvents.length > 0 ? (
          <div className="space-y-2">
            {recentEvents.slice(0, 10).map((event, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-[#05070B] rounded-lg text-sm">
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-[#A9B2C7]" />
                  <span className="text-[#A9B2C7]">
                    {new Date(event.createdAt).toLocaleString('pt-BR', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                  <span className="text-white">{event.eventType}</span>
                  {event.productKey && (
                    <span className="text-[#19E0FF]">{event.productKey}</span>
                  )}
                </div>
                <div className="text-right">
                  {event.amountBrl && (
                    <span className="text-[#19E0FF] font-bold">R$ {event.amountBrl.toFixed(2)}</span>
                  )}
                  {event.amountCash && (
                    <span className="text-[#F7CE46] ml-2">{event.amountCash} CASH</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-[#A9B2C7]/30 mx-auto mb-2" />
            <p className="text-[#A9B2C7] text-sm">Nenhuma atividade recente</p>
          </div>
        )}
      </GlowCard>
    </div>
  );
}