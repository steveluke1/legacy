import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, FileText, DollarSign, Download, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import GlowCard from '@/components/ui/GlowCard';
import GradientButton from '@/components/ui/GradientButton';
import OrderStatusBadge from '@/components/mercado/OrderStatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function AdminDisputes() {
  const [orders, setOrders] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const ordersData = await base44.entities.MarketOrder.list();
      setOrders(ordersData || []);

      const logsResponse = await base44.functions.invoke('market_listAdminLogs', { limit: 50 });
      if (logsResponse.data && logsResponse.data.success) {
        setLogs(logsResponse.data.logs || []);
      }
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatus = async (orderId, status) => {
    try {
      const action = status === 'COMPLETED' ? 'buyer_confirm_received' : 
                     status === 'CANCELLED' ? 'cancel_order' : null;
      
      if (!action) return;

      await base44.functions.invoke('market_updateOrderStatus', {
        action,
        order_id: orderId
      });

      toast.success('Status atualizado com sucesso');
      await loadData();
    } catch (e) {
      toast.error('Erro ao atualizar status: ' + e.message);
    }
  };

  const handleExportCSV = async () => {
    try {
      await base44.functions.invoke('market_exportTransactionsCSV', {});
      toast.success('Export iniciado!');
    } catch (e) {
      toast.error('Erro ao exportar: ' + e.message);
    }
  };

  if (loading) {
    return (
      <div>
        <Skeleton className="h-12 w-64 bg-[#19E0FF]/10 mb-8" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-64 bg-[#19E0FF]/10" />
          <Skeleton className="h-64 bg-[#19E0FF]/10" />
        </div>
        <p className="text-center text-[#A9B2C7] text-sm mt-4">Carregando disputas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-16 h-16 text-[#FF4B6A] mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Erro ao carregar disputas</h3>
        <p className="text-[#A9B2C7] mb-6">{error}</p>
        <Button
          onClick={loadData}
          className="bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] text-[#05070B] font-bold"
        >
          Tentar Novamente
        </Button>
      </div>
    );
  }

  const disputedOrders = orders.filter(o => o.status === 'DISPUTA' || o.status === 'PAID');

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-white">Painel de Disputas</h2>
        <GradientButton onClick={handleExportCSV} variant="secondary" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </GradientButton>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <GlowCard className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#19E0FF]/20 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#19E0FF]" />
            </div>
            <span className="text-[#A9B2C7]">Total Pedidos</span>
          </div>
          <p className="text-3xl font-bold text-white">{orders.length}</p>
        </GlowCard>

        <GlowCard className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
            </div>
            <span className="text-[#A9B2C7]">Pendentes</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {orders.filter(o => o.status === 'PAID').length}
          </p>
        </GlowCard>

        <GlowCard className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-[#A9B2C7]">Completos</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {orders.filter(o => o.status === 'COMPLETED').length}
          </p>
        </GlowCard>

        <GlowCard className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#F7CE46]/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-[#F7CE46]" />
            </div>
            <span className="text-[#A9B2C7]">Volume (BRL)</span>
          </div>
          <p className="text-3xl font-bold text-white">
            R$ {orders.reduce((sum, o) => sum + (o.total_price_brl || 0), 0).toFixed(2)}
          </p>
        </GlowCard>
      </div>

      {/* Disputed Orders */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-white mb-4">Pedidos Pendentes</h3>
        {disputedOrders.length === 0 ? (
          <GlowCard className="p-8 text-center">
            <Shield className="w-16 h-16 text-[#A9B2C7]/30 mx-auto mb-4" />
            <p className="text-[#A9B2C7]">Nenhum pedido requer atenção</p>
          </GlowCard>
        ) : (
          <div className="space-y-4">
            {disputedOrders.map((order, index) => {
              const snapshot = order.listing_snapshot || {};
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <GlowCard className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <OrderStatusBadge status={order.status} />
                          <span className="text-[#A9B2C7] text-sm">
                            ID: {order.id.substring(0, 8)}...
                          </span>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <h4 className="text-white font-bold mb-1">Produto</h4>
                            <p className="text-[#A9B2C7]">
                              {snapshot.type === 'ALZ' 
                                ? `${snapshot.alz_amount?.toLocaleString()} ALZ`
                                : snapshot.item_name
                              }
                            </p>
                          </div>
                          <div>
                            <h4 className="text-white font-bold mb-1">Valor</h4>
                            <p className="text-[#19E0FF] font-bold">
                              R$ {order.total_price_brl?.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-white font-bold mb-1">Comprador</h4>
                            <p className="text-[#A9B2C7]">{order.buyer_username}</p>
                          </div>
                          <div>
                            <h4 className="text-white font-bold mb-1">Data</h4>
                            <p className="text-[#A9B2C7]">
                              {format(new Date(order.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 lg:min-w-[180px]">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <GradientButton variant="primary" size="sm" className="w-full">
                              Marcar Completo
                            </GradientButton>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-[#0C121C] border-[#19E0FF]/30">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Confirmar conclusão</AlertDialogTitle>
                              <AlertDialogDescription className="text-[#A9B2C7]">
                                Confirmar que o pedido foi concluído?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-transparent border-[#19E0FF]/20 text-white">
                                Cancelar
                              </AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleChangeStatus(order.id, 'COMPLETED')}
                                className="bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8]"
                              >
                                Confirmar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <GradientButton variant="danger" size="sm" className="w-full">
                              Cancelar
                            </GradientButton>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-[#0C121C] border-[#19E0FF]/30">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">Cancelar pedido</AlertDialogTitle>
                              <AlertDialogDescription className="text-[#A9B2C7]">
                                O comprador será reembolsado.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-transparent border-[#19E0FF]/20 text-white">
                                Voltar
                              </AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleChangeStatus(order.id, 'CANCELLED')}
                                className="bg-gradient-to-r from-[#FF4B6A] to-[#FF6B8A]"
                              >
                                Cancelar Pedido
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </GlowCard>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}