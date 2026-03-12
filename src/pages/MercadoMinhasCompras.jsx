import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ChevronLeft, ShoppingBag, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthProvider';
import RequireAuth from '@/components/auth/RequireAuth';
import GlowCard from '@/components/ui/GlowCard';
import GradientButton from '@/components/ui/GradientButton';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import OrderStatusBadge from '@/components/mercado/OrderStatusBadge';
import LoadingShell from '@/components/ui/LoadingShell';

export default function MercadoMinhasCompras() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null);

  useEffect(() => {
    if (user) {
      loadMyOrders();
    }
  }, [user]);

  const loadMyOrders = async () => {
    try {
      const response = await base44.functions.invoke('market_getMyOrders', {});
      if (response.data && response.data.success) {
        setOrders(response.data.orders || []);
      }
    } catch (e) {
      console.error('Erro ao carregar compras:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceived = async (orderId) => {
    setConfirmingId(orderId);
    try {
      const response = await base44.functions.invoke('market_updateOrderStatus', {
        action: 'buyer_confirm_received',
        order_id: orderId
      });
      if (response.data && response.data.success) {
        loadMyOrders();
      }
    } catch (e) {
      console.error('Erro ao confirmar recebimento:', e);
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <RequireAuth>
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <Link 
          to={createPageUrl('Mercado')}
          className="inline-flex items-center gap-2 text-[#A9B2C7] hover:text-white transition-colors mb-8"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar ao Mercado
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-white mb-8">Minhas compras</h1>

          {loading ? (
            <LoadingShell message="Carregando compras..." fullScreen={false} />
          ) : orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order, index) => {
                const snapshot = order.listing_snapshot || {};
                const isAlz = snapshot.type === 'ALZ';
                
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <GlowCard className="p-6">
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-bold text-white">
                              {isAlz 
                                ? `${snapshot.alz_amount?.toLocaleString()} ALZ`
                                : snapshot.item_name
                              }
                            </h3>
                            <OrderStatusBadge status={order.status} />
                          </div>

                          {!isAlz && snapshot.item_description && (
                            <p className="text-[#A9B2C7] text-sm mb-2">
                              {snapshot.item_description}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <span className="text-white font-bold">
                              R$ {order.total_price_brl?.toFixed(2)}
                            </span>
                            <span className="text-[#A9B2C7]">
                              Pedido em {new Date(order.created_at).toLocaleDateString('pt-BR')}
                            </span>
                            {order.completed_at && (
                              <span className="text-green-400">
                                Concluído em {new Date(order.completed_at).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Link to={createPageUrl(`MercadoPedido?id=${order.listing_id}`)}>
                            <GradientButton variant="secondary" size="sm">
                              Ver detalhes
                            </GradientButton>
                          </Link>

                          {order.status === 'PAID' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <GradientButton 
                                  size="sm"
                                  disabled={confirmingId === order.id}
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Confirmar recebimento
                                </GradientButton>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-[#0C121C] border-[#19E0FF]/20">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-white">Confirmar recebimento</AlertDialogTitle>
                                  <AlertDialogDescription className="text-[#A9B2C7]">
                                    Ao clicar em "Confirmar que recebi", você declara que já recebeu o ALZ/Item dentro do jogo.
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-[#05070B] text-white border-[#19E0FF]/20">
                                    Cancelar
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleConfirmReceived(order.id)}
                                    className="bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] text-[#05070B]"
                                  >
                                    Sim, já recebi
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    </GlowCard>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <GlowCard className="p-12 text-center">
              <ShoppingBag className="w-16 h-16 text-[#A9B2C7]/30 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Você ainda não fez compras</h3>
              <p className="text-[#A9B2C7] mb-6">
                Navegue pelo Mercado e encontre ALZ ou itens para comprar!
              </p>
              <Link to={createPageUrl('Mercado')}>
                <GradientButton>Ir ao Mercado</GradientButton>
              </Link>
            </GlowCard>
          )}
        </motion.div>
      </div>
    </div>
    </RequireAuth>
  );
}