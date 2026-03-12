import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ChevronLeft, Coins, Package, X, AlertTriangle, Clock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { authClient } from '@/components/auth/authClient';
import RequireAuth from '@/components/auth/RequireAuth';
import GlowCard from '@/components/ui/GlowCard';
import GradientButton from '@/components/ui/GradientButton';
import MetalButton from '@/components/ui/MetalButton';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import LoadingShell from '@/components/ui/LoadingShell';
import { toast } from 'sonner';

const statusLabels = {
  active: { label: 'Ativo', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  partial: { label: 'Parcial', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  filled: { label: 'Vendido', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500/20 text-red-400 border-red-500/30' }
};

const ListingStatusBadge = ({ status }) => {
  const config = statusLabels[status] || statusLabels.ACTIVE;
  return <Badge className={config.color}>{config.label}</Badge>;
};

export default function MercadoMinhasOfertas() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    loadMyOffers(1);
  }, []);

  const loadMyOffers = async (page = 1) => {
    try {
      setLoading(true);
      const token = authClient.getToken();
      
      if (!token) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }

      const response = await base44.functions.invoke('alzGetMySellOrdersV1', {
        token,
        page,
        pageSize: 20
      });

      if (response.data?.ok) {
        const { items, pagination } = response.data.data;
        
        if (page === 1) {
          setListings(items);
        } else {
          setListings(prev => [...prev, ...items]);
        }
        
        setHasMore(pagination.hasMore);
        setCurrentPage(page);
      } else {
        toast.error(response.data?.error?.message || 'Erro ao carregar ofertas');
      }
    } catch (e) {
      console.error('Erro ao carregar ofertas:', e);
      toast.error('Não foi possível carregar suas ofertas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelListing = async (listingId) => {
    setCancellingId(listingId);
    try {
      const token = authClient.getToken();
      
      if (!token) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }

      const response = await base44.functions.invoke('alzCancelSellOrderV1', {
        token,
        sellOrderId: listingId
      });

      if (response.data?.ok) {
        toast.success(response.data.data.message || 'Oferta cancelada com sucesso!');
        loadMyOffers(1); // Reload from first page
      } else {
        const error = response.data?.error;
        
        if (error?.code === 'CANCEL_NOT_ALLOWED_YET' && error?.remainingSeconds) {
          const hours = Math.floor(error.remainingSeconds / 3600);
          const minutes = Math.floor((error.remainingSeconds % 3600) / 60);
          toast.error(`Disponível em ${hours}h ${minutes}m`);
        } else {
          toast.error(error?.message || 'Erro ao cancelar oferta');
        }
      }
    } catch (e) {
      console.error('Erro ao cancelar oferta:', e);
      toast.error('Erro ao cancelar oferta. Tente novamente.');
    } finally {
      setCancellingId(null);
    }
  };

  const formatTimeRemaining = (hours) => {
    if (!hours || hours <= 0) return '0h 0m';
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const formatAlz = (amount) => {
    const billions = amount / 1_000_000_000;
    if (billions >= 1) {
      return `${billions.toFixed(2)}B ALZ`;
    }
    const millions = amount / 1_000_000;
    return `${millions.toFixed(0)}M ALZ`;
  };

  const formatBRL = (amount) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
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
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white">Minhas Ofertas de Venda</h1>
            <Link to={createPageUrl('MercadoAlzVender')}>
              <GradientButton>Vender ALZ</GradientButton>
            </Link>
          </div>

          {loading ? (
            <LoadingShell message="Carregando ofertas..." fullScreen={false} />
          ) : listings.length > 0 ? (
            <>
              <div className="space-y-4">
                {listings.map((listing, index) => {
                  const totalPriceBRL = (listing.total_alz / 1_000_000_000) * listing.price_per_billion_brl;
                  const canCancel = listing.canCancel;
                  const isCancellable = ['active', 'partial'].includes(listing.status);
                  
                  return (
                    <motion.div
                      key={listing.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <GlowCard className="p-6">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-[#F7CE46]/20">
                              <Coins className="w-7 h-7 text-[#F7CE46]" />
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="text-lg font-bold text-white">
                                  {formatAlz(listing.total_alz)}
                                </h3>
                                <ListingStatusBadge status={listing.status} />
                              </div>

                              <div className="flex flex-wrap items-center gap-4 text-sm mb-2">
                                <span className="text-[#19E0FF] font-bold">
                                  {formatBRL(listing.price_per_billion_brl)} / 1B ALZ
                                </span>
                                <span className="text-white font-bold">
                                  Total: {formatBRL(totalPriceBRL)}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-4 text-sm">
                                <span className="text-[#A9B2C7]">
                                  Restante: {formatAlz(listing.remaining_alz)}
                                </span>
                                <span className="text-[#A9B2C7]">
                                  Criado em {new Date(listing.created_date).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 items-center">
                            {isCancellable && !canCancel && (
                              <div className="flex items-center gap-2 px-3 py-2 bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded-lg">
                                <Clock className="w-4 h-4" />
                                <span className="text-xs">
                                  Disponível em {formatTimeRemaining(listing.hoursUntilCancel)}
                                </span>
                              </div>
                            )}

                            {isCancellable && canCancel && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <button
                                    disabled={cancellingId === listing.id}
                                    className="px-4 py-2 bg-[#FF4B6A]/20 text-[#FF4B6A] border border-[#FF4B6A]/30 rounded-lg hover:bg-[#FF4B6A]/30 transition-colors disabled:opacity-50 flex items-center gap-2"
                                  >
                                    <X className="w-4 h-4" />
                                    <span>Cancelar</span>
                                  </button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-[#0C121C] border-[#19E0FF]/20">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-white">Cancelar oferta de venda?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-[#A9B2C7]">
                                      Tem certeza que deseja cancelar esta oferta? O ALZ bloqueado será liberado automaticamente.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-[#05070B] text-white border-[#19E0FF]/20">
                                      Voltar
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleCancelListing(listing.id)}
                                      className="bg-[#FF4B6A] text-white hover:bg-[#FF4B6A]/80"
                                    >
                                      Sim, cancelar
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

              {hasMore && (
                <div className="text-center mt-6">
                  <MetalButton 
                    onClick={() => loadMyOffers(currentPage + 1)}
                    variant="secondary"
                    loading={loading}
                  >
                    Carregar mais
                  </MetalButton>
                </div>
              )}
            </>
          ) : (
            <GlowCard className="p-12 text-center">
              <Coins className="w-16 h-16 text-[#A9B2C7]/30 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Você ainda não criou ofertas de venda</h3>
              <p className="text-[#A9B2C7] mb-6">
                Crie sua primeira oferta de venda de ALZ e comece a negociar!
              </p>
              <Link to={createPageUrl('MercadoAlzVender')}>
                <GradientButton>Vender ALZ</GradientButton>
              </Link>
            </GlowCard>
          )}
        </motion.div>
      </div>
    </div>
    </RequireAuth>
  );
}