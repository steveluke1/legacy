import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { marketplaceClient } from '@/components/marketplace/marketplaceClient';
import { authClient } from '@/components/auth/authClient';
import { Loader2, AlertCircle, ArrowLeft, Package, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import OrderStatusTimeline from '@/components/marketplace/OrderStatusTimeline';

export default function PedidoAlzDetalhe() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['order-status', orderId],
    queryFn: async () => {
      const token = authClient.getToken();
      if (!token) throw new Error('Sessão expirada');
      return marketplaceClient.getOrderStatus(orderId, token);
    },
    staleTime: 5000,
    refetchInterval: (data) => {
      // Poll if order is not final state
      const status = data?.order?.status;
      if (status === 'awaiting_pix' || status === 'paid' || status === 'delivering') {
        return 5000; // 5 seconds
      }
      return false;
    },
    refetchOnWindowFocus: true
  });

  const formatPrice = (price) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  const statusConfig = {
    created: { icon: Clock, color: 'text-[#A9B2C7]', label: 'Criado' },
    awaiting_pix: { icon: Clock, color: 'text-[#F7CE46]', label: 'Aguardando Pagamento' },
    paid: { icon: CheckCircle, color: 'text-[#10B981]', label: 'Pago' },
    delivering: { icon: Package, color: 'text-[#19E0FF]', label: 'Em Entrega' },
    delivered: { icon: CheckCircle, color: 'text-[#10B981]', label: 'Entregue' },
    manual_review: { icon: AlertTriangle, color: 'text-[#F7CE46]', label: 'Em Análise' },
    failed: { icon: AlertCircle, color: 'text-[#FF4B6A]', label: 'Falhou' },
    cancelled: { icon: AlertCircle, color: 'text-[#FF4B6A]', label: 'Cancelado' }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#05070B] py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <Skeleton className="h-96 bg-[#19E0FF]/10" />
        </div>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="min-h-screen bg-[#05070B] flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-[#FF4B6A] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Pedido não encontrado</h2>
          <p className="text-[#A9B2C7] mb-6">{error?.message || 'Não foi possível carregar os dados do pedido'}</p>
          <button
            onClick={() => navigate('/minha-conta/pedidos-alz')}
            className="px-6 py-3 bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] text-[#05070B] font-bold rounded-lg"
          >
            Ver Meus Pedidos
          </button>
        </div>
      </div>
    );
  }

  const order = data.order;
  const status = statusConfig[order.status] || statusConfig.created;
  const StatusIcon = status.icon;

  return (
    <div className="min-h-screen bg-[#05070B] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/minha-conta/pedidos-alz')}
          className="flex items-center gap-2 text-[#19E0FF] hover:text-[#1A9FE8] mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar aos Meus Pedidos
        </button>

        {/* Order Header */}
        <div className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Pedido de ALZ</h1>
              <p className="text-sm text-[#A9B2C7] font-mono">ID: {order.order_id}</p>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${status.color} bg-current/10`}>
              <StatusIcon className="w-5 h-5" />
              <span className="font-semibold">{status.label}</span>
            </div>
          </div>

          {/* Order Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-[#A9B2C7] mb-1">Quantidade de ALZ</p>
              <p className="text-2xl font-bold text-white">{(order.alz_amount / 1000000000).toFixed(2)}B</p>
            </div>
            <div>
              <p className="text-sm text-[#A9B2C7] mb-1">Valor Pago</p>
              <p className="text-2xl font-bold text-[#10B981]">{formatPrice(order.price_brl)}</p>
            </div>
            <div>
              <p className="text-sm text-[#A9B2C7] mb-1">Personagem</p>
              <p className="text-lg font-semibold text-white">{order.buyer_character_name || order.character_nick}</p>
            </div>
            <div>
              <p className="text-sm text-[#A9B2C7] mb-1">Data do Pedido</p>
              <p className="text-lg text-white">{new Date(order.created_date).toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-6">Linha do Tempo</h2>
          <OrderStatusTimeline status={order.status} timeline={data.timeline || []} />
        </div>

        {/* Warnings/Info */}
        {order.status === 'manual_review' && (
          <div className="bg-[#F7CE46]/10 border border-[#F7CE46]/30 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-[#F7CE46] flex-shrink-0 mt-1" />
              <div>
                <p className="text-white font-semibold mb-2">Pedido em Análise</p>
                <p className="text-[#A9B2C7] text-sm">
                  Seu pedido está sendo analisado pela nossa equipe. Isso pode acontecer por motivos de segurança ou quando há dificuldade na entrega automática. 
                  Entraremos em contato em breve.
                </p>
              </div>
            </div>
          </div>
        )}

        {order.status === 'delivered' && (
          <div className="bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-[#10B981] flex-shrink-0 mt-1" />
              <div>
                <p className="text-white font-semibold mb-2">Pedido Entregue!</p>
                <p className="text-[#A9B2C7] text-sm">
                  Os ALZ foram entregues com sucesso para o personagem <strong className="text-white">{order.buyer_character_name || order.character_nick}</strong>.
                </p>
                {order.delivered_at && (
                  <p className="text-[#A9B2C7] text-sm mt-1">
                    Data de entrega: {new Date(order.delivered_at).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Support */}
        <div className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-xl p-6">
          <h3 className="text-lg font-bold text-white mb-3">Precisa de Ajuda?</h3>
          <p className="text-[#A9B2C7] text-sm mb-4">
            Se você tiver qualquer dúvida sobre seu pedido, entre em contato com nosso suporte.
          </p>
          <button
            onClick={() => navigate('/suporte')}
            className="px-6 py-3 bg-[#19E0FF]/20 text-[#19E0FF] rounded-lg hover:bg-[#19E0FF]/30"
          >
            Falar com Suporte
          </button>
        </div>
      </div>
    </div>
  );
}