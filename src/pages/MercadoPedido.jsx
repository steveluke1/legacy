import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ChevronLeft, Coins, Package, User, AlertCircle, Star } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthProvider';
import CrystalBorder from '@/components/ui/CrystalBorder';
import MetalButton from '@/components/ui/MetalButton';
import SellerBadge from '@/components/mercado/SellerBadge';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import PaymentInstructions from '@/components/mercado/PaymentInstructions';
import OrderTimeline from '@/components/mercado/OrderTimeline';

export default function MercadoPedido() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [paymentData, setPaymentData] = useState(null);
  const [orderId, setOrderId] = useState(null);
  const [providerReference, setProviderReference] = useState(null);
  const [sellerBadges, setSellerBadges] = useState([]);
  const [sellerRating, setSellerRating] = useState(null);

  useEffect(() => {
    loadListing();
  }, []);

  useEffect(() => {
    if (user) {
      checkRMTTerms();
    }
  }, [user]);

  const checkRMTTerms = async () => {
    try {
      const termsResponse = await base44.functions.invoke('market_checkRMTTerms', {});
      if (termsResponse.data && !termsResponse.data.has_accepted) {
        const urlParams = new URLSearchParams(window.location.search);
        const listingId = urlParams.get('id');
        navigate(createPageUrl('MercadoTermos') + '?return=MercadoPedido&id=' + listingId);
      }
    } catch (e) {
      console.error('Erro ao verificar termos:', e);
    }
  };

  const loadListing = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const listingId = urlParams.get('id');
      
      if (!listingId) {
        navigate(createPageUrl('Mercado'));
        return;
      }

      const response = await base44.functions.invoke('market_getListing', { listing_id: listingId });
      if (response.data && response.data.success) {
        const listingData = response.data.listing;
        setListing(listingData);
        
        // Load seller info
        if (listingData.seller_user_id) {
          loadSellerInfo(listingData.seller_user_id);
        }
      } else {
        navigate(createPageUrl('Mercado'));
      }
    } catch (e) {
      console.error('Erro ao carregar anúncio:', e);
      navigate(createPageUrl('Mercado'));
    } finally {
      setLoading(false);
    }
  };

  const loadSellerInfo = async (sellerId) => {
    try {
      const response = await base44.functions.invoke('market_getSellerBadges', {
        seller_user_id: sellerId
      });
      if (response.data && response.data.success) {
        setSellerBadges(response.data.badges || []);
        
        // Seller rating is now included in getSellerBadges response
        if (response.data.rating) {
          setSellerRating(response.data.rating);
        }
      }
    } catch (e) {
      console.error('Erro ao carregar seller info:', e);
    }
  };

  const handleCreateOrder = async () => {
    if (!user) {
      navigate(createPageUrl('Login'));
      return;
    }

    setCreatingOrder(true);

    try {
      const response = await base44.functions.invoke('market_createOrder', {
        listing_id: listing.id
      });

      if (response.data && response.data.success) {
        setPaymentData(response.data.payment);
        setOrderId(response.data.order.id);
        
        // Provider reference is now included in payment response
        if (response.data.payment.provider_reference) {
          setProviderReference(response.data.payment.provider_reference);
        }
      } else {
        alert(response.data?.error || 'Erro ao criar pedido. Tente novamente.');
      }
    } catch (e) {
      console.error('Erro ao criar pedido:', e);
      alert('Erro ao criar pedido. Tente novamente.');
    } finally {
      setCreatingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-32 bg-[#19E0FF]/10 mb-8" />
          <Skeleton className="h-96 w-full bg-[#19E0FF]/10 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen py-20 px-4 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-[#A9B2C7]/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Anúncio não encontrado</h3>
          <Link to={createPageUrl('Mercado')} className="text-[#19E0FF] hover:underline">
            Voltar ao Mercado
          </Link>
        </div>
      </div>
    );
  }

  const isAlz = listing.type === 'ALZ';
  const isSeller = user && user.id === listing.seller_user_id;
  const isAvailable = listing.status === 'ACTIVE';

  const handleSimulatePayment = async () => {
    if (providerReference) {
      try {
        const response = await base44.functions.invoke('market_simulatePayment', {
          provider_reference: providerReference
        });
        if (response.data && response.data.success) {
          // Redirect to purchases
          setTimeout(() => {
            navigate(createPageUrl('MercadoMinhasCompras'));
          }, 1500);
        }
      } catch (e) {
        console.error('Erro ao simular pagamento:', e);
      }
    }
  };

  // Payment flow
  if (paymentData) {
    return (
      <div className="min-h-screen py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <Link 
            to={createPageUrl('Mercado')}
            className="inline-flex items-center gap-2 text-[#A9B2C7] hover:text-white transition-colors mb-8"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar ao Mercado
          </Link>

          <div className="mb-8">
            <OrderTimeline currentStatus="created" />
          </div>

          <PaymentInstructions 
            paymentData={paymentData}
            listingSnapshot={listing}
            onSimulatePayment={handleSimulatePayment}
          />

          <div className="mt-6 text-center">
            <Link 
              to={createPageUrl('MercadoMinhasCompras')}
              className="text-[#19E0FF] hover:underline"
            >
              Ver minhas compras
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-4xl mx-auto">
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
          <CrystalBorder tier="Platinum Crystal" showLabel>
            <div className="p-8">
            {/* Status badge */}
            {!isAvailable && (
              <div className="mb-6 p-4 bg-[#FF4B6A]/10 border border-[#FF4B6A]/30 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-[#FF4B6A]" />
                <span className="text-[#FF4B6A]">
                  Este anúncio não está mais disponível.
                </span>
              </div>
            )}

            {/* Header */}
            <div className="flex items-start gap-6 mb-8">
              <div 
                className={`w-20 h-20 rounded-2xl flex items-center justify-center ${
                  isAlz ? 'bg-[#F7CE46]/20' : 'bg-[#19E0FF]/20'
                }`}
              >
                {isAlz ? (
                  <Coins className="w-10 h-10 text-[#F7CE46]" />
                ) : (
                  <Package className="w-10 h-10 text-[#19E0FF]" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-white">
                    {isAlz 
                      ? `${listing.alz_amount?.toLocaleString()} ALZ`
                      : listing.item_name
                    }
                  </h1>
                  <Badge className={`${isAlz ? 'bg-[#F7CE46]/20 text-[#F7CE46] border-[#F7CE46]/30' : 'bg-[#19E0FF]/20 text-[#19E0FF] border-[#19E0FF]/30'}`}>
                    {isAlz ? 'ALZ' : 'Item'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[#A9B2C7]">
                    <User className="w-4 h-4" />
                    <span>Vendedor: <strong className="text-white">{listing.seller_username}</strong></span>
                  </div>
                  
                  {sellerRating && (
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-[#FFD700] fill-[#FFD700]" />
                      <span className="text-white font-bold">{sellerRating.avg}</span>
                      <span className="text-[#A9B2C7] text-sm">({sellerRating.count} avaliações)</span>
                    </div>
                  )}
                  
                  {sellerBadges.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {sellerBadges.map(badge => (
                        <SellerBadge key={badge} badge={badge} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right">
                <p className="text-[#A9B2C7] text-sm mb-1">Preço total</p>
                <p className="text-3xl font-bold text-white">
                  R$ {listing.price_brl?.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-6 mb-8">
              {!isAlz && listing.item_description && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Descrição</h3>
                  <p className="text-[#A9B2C7] whitespace-pre-wrap">{listing.item_description}</p>
                </div>
              )}

              {!isAlz && listing.quantity_units && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Quantidade</h3>
                  <p className="text-[#A9B2C7]">{listing.quantity_units} unidade(s)</p>
                </div>
              )}

              {listing.seller_notes && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Observações do vendedor</h3>
                  <div className="p-4 bg-[#05070B] rounded-lg border border-[#19E0FF]/20">
                    <p className="text-[#A9B2C7] whitespace-pre-wrap">{listing.seller_notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* How it works */}
            {isAvailable && !isSeller && (
              <div className="mb-8 p-6 bg-[#05070B] rounded-lg border border-[#19E0FF]/20">
                <h3 className="text-lg font-bold text-white mb-4">Como funciona</h3>
                <div className="space-y-3 text-[#A9B2C7]">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#19E0FF]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[#19E0FF] text-sm font-bold">1</span>
                    </div>
                    <p>Confirme os detalhes do anúncio</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#19E0FF]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[#19E0FF] text-sm font-bold">2</span>
                    </div>
                    <p>Pague o valor em reais pelo site (PIX, cartão, etc.)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#19E0FF]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-[#19E0FF] text-sm font-bold">3</span>
                    </div>
                    <p>Combine com o vendedor e receba o {isAlz ? 'ALZ' : 'item'} dentro do jogo CABAL ZIRON</p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            {isAvailable && !isSeller ? (
              <MetalButton
                onClick={handleCreateOrder}
                loading={creatingOrder}
                className="w-full"
                size="lg"
              >
                Continuar para pagamento
              </MetalButton>
            ) : isAvailable && isSeller ? (
              <div className="text-center p-4 bg-[#19E0FF]/10 border border-[#19E0FF]/30 rounded-lg">
                <p className="text-[#A9B2C7]">Este é o seu próprio anúncio</p>
              </div>
            ) : null}
            </div>
          </CrystalBorder>
        </motion.div>
      </div>
    </div>
  );
}