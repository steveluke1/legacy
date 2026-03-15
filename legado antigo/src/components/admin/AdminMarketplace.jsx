import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminMarketplaceClient } from '@/components/marketplace/adminMarketplaceClient';
import { TrendingUp, DollarSign, Loader2, AlertCircle, Package } from 'lucide-react';
import { useAdminAuth } from './AdminAuthProvider';
import MarketFeeSettings from '@/components/marketplace/MarketFeeSettings';
import EfiConfigPanel from './EfiConfigPanel';
import MarketplaceQAChecklist from './MarketplaceQAChecklist';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import GlowCard from '@/components/ui/GlowCard';

export default function AdminMarketplace() {
  const { token } = useAdminAuth();
  const queryClient = useQueryClient();
  const [newFeePercent, setNewFeePercent] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: config, isLoading: loadingConfig, refetch: refetchConfig } = useQuery({
    queryKey: ['admin-market-config'],
    queryFn: () => adminMarketplaceClient.getConfig(),
    staleTime: 60000,
    refetchOnWindowFocus: false
  });

  const { data: ordersData, isLoading: loadingOrders, refetch: refetchOrders } = useQuery({
    queryKey: ['admin-market-orders', statusFilter],
    queryFn: () => adminMarketplaceClient.listOrders({ 
      status: statusFilter === 'all' ? undefined : statusFilter,
      page: 1,
      limit: 50
    }),
    staleTime: 30000,
    refetchOnWindowFocus: false
  });

  const setFeeMutation = useMutation({
    mutationFn: (feePercent) => adminMarketplaceClient.setMarketFee(feePercent),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-market-config'] });
      setNewFeePercent('');
      toast.success(`Taxa atualizada para ${data.config.market_fee_percent}%`);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const seedDemoMutation = useMutation({
    mutationFn: () => adminMarketplaceClient.seedDemoData(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-market-orders'] });
      toast.success('Dados demo criados com sucesso');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const formatPrice = (price) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  const statusLabels = {
    created: { label: 'Criado', color: 'text-[#A9B2C7]' },
    awaiting_pix: { label: 'Aguardando Pagamento', color: 'text-[#F7CE46]' },
    paid: { label: 'Pago', color: 'text-[#10B981]' },
    delivering: { label: 'Em Entrega', color: 'text-[#19E0FF]' },
    delivered: { label: 'Entregue', color: 'text-[#10B981]' },
    in_review: { label: 'Em Revisão', color: 'text-[#F7CE46]' },
    cancelled: { label: 'Cancelado', color: 'text-[#FF4B6A]' },
    failed: { label: 'Falhou', color: 'text-[#FF4B6A]' }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Marketplace de ALZ</h2>
          {ordersData?.notes?.source === 'entities_fallback' && (
            <p className="text-xs text-blue-400 mt-1">
              • Modo compatível: dados carregados diretamente do banco
            </p>
          )}
        </div>
        <button
          onClick={() => seedDemoMutation.mutate()}
          disabled={seedDemoMutation.isPending}
          className="px-4 py-2 bg-[#19E0FF]/20 text-[#19E0FF] rounded hover:bg-[#19E0FF]/30 disabled:opacity-50"
        >
          {seedDemoMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Seed Dados Demo'}
        </button>
      </div>

      {/* Config Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <MarketFeeSettings adminToken={token} />
        <EfiConfigPanel adminToken={token} />
      </div>

      {/* QA Checklist */}
      <MarketplaceQAChecklist />

      {/* Orders Section */}
      <GlowCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Pedidos de ALZ</h3>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 bg-[#05070B] border-[#19E0FF]/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="awaiting_pix">Aguardando Pagamento</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="delivering">Em Entrega</SelectItem>
              <SelectItem value="delivered">Entregue</SelectItem>
              <SelectItem value="in_review">Em Revisão</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loadingOrders ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-24 bg-[#19E0FF]/10" />
            ))}
          </div>
        ) : !ordersData?.orders || ordersData.orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-[#A9B2C7]/30 mx-auto mb-3" />
            <p className="text-[#A9B2C7]">Nenhum pedido encontrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ordersData.orders.map(order => {
              const statusInfo = statusLabels[order.status] || statusLabels.created;
              return (
                <div key={order.order_id} className="bg-[#05070B] border border-[#19E0FF]/10 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-[#A9B2C7] mb-1 font-mono">{order.order_id}</p>
                      <p className="text-white font-semibold mb-1">
                        {(order.alz_amount / 1000000000).toFixed(2)}B ALZ → {order.buyer_character_name}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-[#A9B2C7]">
                          Valor: <span className="text-white font-semibold">{formatPrice(order.price_brl)}</span>
                        </span>
                        <span className="text-[#A9B2C7]">
                          Taxa: <span className="text-[#F7CE46]">{formatPrice(order.market_fee_brl || 0)}</span>
                        </span>
                        <span className="text-[#A9B2C7]">
                          Data: {new Date(order.created_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlowCard>
    </div>
  );
}