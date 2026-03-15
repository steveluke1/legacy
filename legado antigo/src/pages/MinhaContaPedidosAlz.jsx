import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { marketplaceClient } from '@/components/marketplace/marketplaceClient';
import { authClient } from '@/components/auth/authClient';
import { useAuth } from '@/components/auth/AuthProvider';
import { Loader2, AlertCircle, Package, ExternalLink } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { createPageUrl } from '@/utils';

export default function MinhaContaPedidosAlz() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      authClient.redirectToLogin('/minha-conta/pedidos-alz');
    }
  }, [user]);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['my-alz-orders', user?.id],
    queryFn: async () => {
      const token = authClient.getToken();
      if (!token) throw new Error('Sessão expirada');
      return marketplaceClient.getMyOrders(user.id, token);
    },
    enabled: !!user,
    staleTime: 30000,
    refetchOnWindowFocus: false
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
    <div className="min-h-screen bg-[#05070B] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Meus Pedidos de ALZ</h1>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-32 bg-[#19E0FF]/10" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <AlertCircle className="w-16 h-16 text-[#FF4B6A] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Erro ao carregar pedidos</h3>
            <p className="text-[#A9B2C7] mb-6">{error.message}</p>
            <button
              onClick={() => refetch()}
              className="px-6 py-3 bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] text-[#05070B] font-bold rounded-lg"
            >
              Tentar Novamente
            </button>
          </div>
        ) : !data?.orders || data.orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-[#A9B2C7]/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Nenhum pedido encontrado</h3>
            <p className="text-[#A9B2C7]">Você ainda não fez compras de ALZ</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.orders.map(order => {
              const statusInfo = statusLabels[order.status] || statusLabels.created;
              return (
                <div 
                  key={order.order_id} 
                  className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-xl p-6 hover:border-[#19E0FF]/40 transition-colors cursor-pointer"
                  onClick={() => navigate(`/pedido-alz/${order.order_id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <p className="text-sm text-[#A9B2C7] mb-1">ID: {order.order_id.substring(0, 20)}...</p>
                      <p className="text-white font-semibold">
                        {(order.alz_amount / 1000000000).toFixed(2)}B ALZ para {order.buyer_character_name}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-semibold ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      <ExternalLink className="w-5 h-5 text-[#19E0FF]" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-[#19E0FF]/10">
                    <div>
                      <p className="text-xs text-[#A9B2C7]">Valor pago</p>
                      <p className="text-xl font-bold text-white">{formatPrice(order.price_brl)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#A9B2C7]">Data</p>
                      <p className="text-sm text-white">
                        {new Date(order.created_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}