import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, TrendingUp, DollarSign, Package, Loader2, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAdminAuth } from './AdminAuthProvider';
import { adminClient } from './adminClient';
import GlowCard from '@/components/ui/GlowCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminStoreSales() {
  const { token } = useAdminAuth();
  const [days, setDays] = useState(30);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-store-sales', days],
    queryFn: async () => {
      const response = await adminClient.apiGetStoreSales(token, 100, days);
      return response;
    },
    enabled: !!token,
    staleTime: 60000,
    retry: 1,
    refetchOnWindowFocus: false
  });

  const itemTypeLabels = {
    PREMIUM: 'Planos Premium',
    BOX: 'Caixas',
    GIFT_CARD: 'Gift Cards',
    PACKAGE: 'Pacotes',
    ITEM: 'Itens'
  };

  const statusLabels = {
    pending: 'Pendente',
    paid: 'Pago',
    fulfilled: 'Entregue',
    cancelled: 'Cancelado',
    failed: 'Falhou'
  };

  const statusColors = {
    pending: 'bg-[#F7CE46]/20 text-[#F7CE46] border-[#F7CE46]/30',
    paid: 'bg-[#19E0FF]/20 text-[#19E0FF] border-[#19E0FF]/30',
    fulfilled: 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30',
    cancelled: 'bg-[#A9B2C7]/20 text-[#A9B2C7] border-[#A9B2C7]/30',
    failed: 'bg-[#FF4B6A]/20 text-[#FF4B6A] border-[#FF4B6A]/30'
  };

  if (isLoading) {
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
        <Skeleton className="h-96 bg-[#19E0FF]/10" />
        <p className="text-center text-[#A9B2C7] text-sm">Carregando vendas da loja...</p>
      </div>
    );
  }

  if (error?.message?.includes('Não autorizado') || error?.message?.includes('401') || error?.message?.includes('403')) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-16 h-16 text-[#FF4B6A] mx-auto mb-4" />
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

  if (!data || !data.success) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-16 h-16 text-[#FF4B6A] mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Erro ao carregar dados de vendas</h3>
        <p className="text-[#A9B2C7] mb-6">{error?.message || 'Tente novamente mais tarde'}</p>
        <button
          onClick={() => refetch()}
          className="px-6 py-3 bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] text-[#05070B] font-bold rounded-lg hover:shadow-lg transition-all"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  const hasOrders = data.orders && data.orders.length > 0;
  
  if (!hasOrders) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Vendas da Loja</h2>
            {data?.notes?.source === 'entities' && (
              <p className="text-xs text-blue-400 mt-1">
                • Modo compatível: dados carregados diretamente do banco
              </p>
            )}
          </div>
          <Select value={String(days)} onValueChange={(val) => setDays(Number(val))}>
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
          <ShoppingBag className="w-16 h-16 text-[#A9B2C7]/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Nenhum pedido encontrado no período selecionado</h3>
          <p className="text-[#A9B2C7]">
            Tente ampliar o período para ver mais resultados
          </p>
        </div>
      </div>
    );
  }

  const { summary, orders, timeseries } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Vendas da Loja</h2>
          {data?.notes?.source === 'entities' && (
            <p className="text-xs text-blue-400 mt-1">
              • Modo compatível: dados carregados diretamente do banco
            </p>
          )}
        </div>
        <Select value={String(days)} onValueChange={(val) => setDays(Number(val))}>
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

      {/* KPI Cards */}
      <div className="grid md:grid-cols-4 gap-6">
        <GlowCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#19E0FF]/20 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-[#19E0FF]" />
            </div>
            <div>
              <p className="text-[#A9B2C7] text-sm">Total de Pedidos</p>
              <p className="text-2xl font-bold text-white">{summary.totalOrders}</p>
            </div>
          </div>
        </GlowCard>

        <GlowCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#10B981]/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-[#10B981]" />
            </div>
            <div>
              <p className="text-[#A9B2C7] text-sm">Receita BRL</p>
              <p className="text-2xl font-bold text-white">
                R$ {summary.totalRevenueBRL.toFixed(2)}
              </p>
            </div>
          </div>
        </GlowCard>

        <GlowCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#F7CE46]/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#F7CE46]" />
            </div>
            <div>
              <p className="text-[#A9B2C7] text-sm">Receita CASH</p>
              <p className="text-2xl font-bold text-white">
                {summary.totalRevenueCash.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </GlowCard>

        <GlowCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#FF4B6A]/20 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-[#FF4B6A]" />
            </div>
            <div>
              <p className="text-[#A9B2C7] text-sm">Entregues</p>
              <p className="text-2xl font-bold text-white">
                {summary.ordersByStatus.fulfilled}
              </p>
            </div>
          </div>
        </GlowCard>
      </div>

      {/* Chart */}
      {timeseries && timeseries.length > 0 && (
        <GlowCard className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">Receita Diária (BRL)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeseries}>
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
              <Line 
                type="monotone" 
                dataKey="revenueBRL" 
                stroke="#19E0FF" 
                strokeWidth={2}
                name="Receita (R$)"
              />
            </LineChart>
          </ResponsiveContainer>
        </GlowCard>
      )}

      {/* By Type */}
      <GlowCard className="p-6">
        <h3 className="text-lg font-bold text-white mb-4">Vendas por Tipo</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(summary.ordersByType).map(([type, stats]) => (
            <div key={type} className="p-4 bg-[#05070B] rounded-lg border border-[#19E0FF]/20">
              <p className="text-[#A9B2C7] text-sm mb-2">{itemTypeLabels[type] || type}</p>
              <p className="text-xl font-bold text-white mb-1">{stats.count} vendas</p>
              <div className="text-xs text-[#A9B2C7]">
                {stats.revenueBRL > 0 && <div>R$ {stats.revenueBRL.toFixed(2)}</div>}
                {stats.revenueCash > 0 && <div>{stats.revenueCash.toLocaleString('pt-BR')} CASH</div>}
              </div>
            </div>
          ))}
        </div>
      </GlowCard>

      {/* Recent Orders */}
      <GlowCard className="p-6">
        <h3 className="text-lg font-bold text-white mb-4">Pedidos Recentes</h3>
        <div className="space-y-3">
          {orders.slice(0, 20).map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className="p-4 bg-[#05070B] rounded-lg border border-[#19E0FF]/20 hover:border-[#19E0FF]/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="text-white font-bold">{order.item_name}</p>
                    <Badge className={statusColors[order.status]}>
                      {statusLabels[order.status]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[#A9B2C7]">
                    <span>{itemTypeLabels[order.item_type]}</span>
                    <span>•</span>
                    <span>Qtd: {order.quantity}</span>
                    <span>•</span>
                    <span>
                      {order.payment_method === 'BRL' 
                        ? `R$ ${order.price_brl?.toFixed(2)}` 
                        : `${order.price_cash?.toLocaleString('pt-BR')} CASH`}
                    </span>
                    <span>•</span>
                    <span>{new Date(order.created_date).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </GlowCard>
    </div>
  );
}