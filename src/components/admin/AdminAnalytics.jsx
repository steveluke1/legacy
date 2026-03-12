import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, User, Shield, DollarSign, Activity, TrendingUp, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAdminAuth } from './AdminAuthProvider';
import GlowCard from '@/components/ui/GlowCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminAnalytics() {
  const { token } = useAdminAuth();
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Summary query with polling
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ['admin-analytics-summary'],
    queryFn: async () => {
      const response = await base44.functions.invoke('admin_getAnalyticsSummary', {
        adminToken: token
      });
      setLastUpdate(new Date());
      return response.data;
    },
    refetchInterval: 10000, // 10 seconds
    enabled: !!token
  });

  // Timeseries query
  const { data: timeseries, isLoading: loadingTimeseries } = useQuery({
    queryKey: ['admin-analytics-timeseries'],
    queryFn: async () => {
      const response = await base44.functions.invoke('admin_getAnalyticsTimeseries', {
        adminToken: token,
        rangeDays: 30
      });
      return response.data;
    },
    staleTime: 60000,
    enabled: !!token
  });

  const formatTime = (date) => {
    const diff = Date.now() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  if (loadingSummary) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Analytics</h2>
        <div className="text-sm text-[#A9B2C7]">
          Atualizado há {formatTime(lastUpdate)}
        </div>
      </div>

      {timeseries?.isTestData && (
        <div className="bg-[#F7CE46]/10 border border-[#F7CE46]/30 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-[#F7CE46]" />
          <span className="text-[#F7CE46] text-sm">
            Dados de teste (ambiente em construção)
          </span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <GlowCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#19E0FF]/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-[#19E0FF]" />
              </div>
              <div>
                <p className="text-[#A9B2C7] text-sm">Contas criadas</p>
                <p className="text-2xl font-bold text-white">
                  {summary?.summary?.totalAccounts?.toLocaleString() || '0'}
                </p>
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
                <p className="text-[#A9B2C7] text-sm">Personagens criados</p>
                <p className="text-2xl font-bold text-white">
                  {summary?.summary?.totalCharacters?.toLocaleString() || '0'}
                </p>
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
                <p className="text-[#A9B2C7] text-sm">Guildas criadas</p>
                <p className="text-2xl font-bold text-white">
                  {summary?.summary?.totalGuilds?.toLocaleString() || '0'}
                </p>
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
                <p className="text-[#A9B2C7] text-sm">Players online agora</p>
                <p className="text-2xl font-bold text-white">
                  {summary?.summary?.onlineNow?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </GlowCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <GlowCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#FFD700]/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#FFD700]" />
              </div>
              <div>
                <p className="text-[#A9B2C7] text-sm">ALZ total no servidor</p>
                <p className="text-2xl font-bold text-white">
                  {summary?.summary?.totalAlz?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </GlowCard>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <GlowCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#FF4B6A]/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[#FF4B6A]" />
              </div>
              <div>
                <p className="text-[#A9B2C7] text-sm">CASH total emitido</p>
                <p className="text-2xl font-bold text-white">
                  {summary?.summary?.cashTotalEmitted?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </GlowCard>
        </motion.div>
      </div>

      {/* Charts */}
      {!loadingTimeseries && timeseries?.series && (
        <div className="grid lg:grid-cols-2 gap-6">
          <GlowCard className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">Contas criadas (últimos 30 dias)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={timeseries.series.accountsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#19E0FF20" />
                <XAxis 
                  dataKey="date" 
                  stroke="#A9B2C7"
                  tick={{ fill: '#A9B2C7' }}
                  tickFormatter={(val) => new Date(val).getDate().toString()}
                />
                <YAxis stroke="#A9B2C7" tick={{ fill: '#A9B2C7' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0C121C', border: '1px solid #19E0FF40' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="value" stroke="#19E0FF" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </GlowCard>

          <GlowCard className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">Players online (últimas 24h)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={timeseries.series.onlineByHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="#19E0FF20" />
                <XAxis 
                  dataKey="ts" 
                  stroke="#A9B2C7"
                  tick={{ fill: '#A9B2C7' }}
                  tickFormatter={(val) => new Date(val).getHours() + 'h'}
                />
                <YAxis stroke="#A9B2C7" tick={{ fill: '#A9B2C7' }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0C121C', border: '1px solid #19E0FF40' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </GlowCard>
        </div>
      )}
    </div>
  );
}