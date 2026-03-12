import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { marketplaceClient } from '@/components/marketplace/marketplaceClient';
import { authClient } from '@/components/auth/authClient';
import { useAuth } from '@/components/auth/AuthProvider';
import { Loader2, AlertCircle, Plus, Lock, X, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function VenderAlz() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      authClient.redirectToLogin('/vender/alz');
    }
  }, [user]);

  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showListingForm, setShowListingForm] = useState(false);
  const [showLockModal, setShowLockModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  // Profile form
  const [profileData, setProfileData] = useState({
    full_name: '',
    cpf: '',
    efi_pix_key: ''
  });

  // Listing form
  const [listingData, setListingData] = useState({
    seller_character_name: '',
    alz_amount: '',
    price_brl: ''
  });

  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ['seller-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const profiles = await base44.entities.SellerPayoutProfile.filter({ seller_user_id: user.id }, undefined, 1);
      return profiles[0] || null;
    },
    enabled: !!user,
    staleTime: 60000
  });

  const { data: config } = useQuery({
    queryKey: ['market-config'],
    queryFn: () => marketplaceClient.getConfig(),
    staleTime: 300000
  });

  const { data: listings, isLoading: loadingListings, refetch: refetchListings } = useQuery({
    queryKey: ['my-listings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const list = await base44.entities.AlzListing.filter({ seller_user_id: user.id }, '-created_date', 50);
      return list;
    },
    enabled: !!user,
    staleTime: 30000
  });

  const saveProfileMutation = useMutation({
    mutationFn: () => marketplaceClient.upsertSellerProfile(profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-profile'] });
      setShowProfileForm(false);
      toast.success('Perfil salvo com sucesso');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const createListingMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('market_createAlzListing', {
        seller_character_name: listingData.seller_character_name,
        alz_amount: parseInt(listingData.alz_amount),
        price_brl: parseFloat(listingData.price_brl)
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      setShowListingForm(false);
      setListingData({ seller_character_name: '', alz_amount: '', price_brl: '' });
      toast.success('Anúncio criado e ALZ travado com sucesso!');
    },
    onError: (error) => {
      const errorMsg = error.response?.data?.error || error.message;
      toast.error(errorMsg);
    }
  });

  const lockAlzMutation = useMutation({
    mutationFn: ({ listingId, idempotencyKey }) => 
      marketplaceClient.lockAlz({ listing_id: listingId, idempotency_key: idempotencyKey }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      setShowLockModal(false);
      setIsOffline(false);
      toast.success('ALZ travado com sucesso! Anúncio ativo.');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const cancelListingMutation = useMutation({
    mutationFn: (listingId) => marketplaceClient.cancelListing(listingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
      toast.success('Anúncio cancelado');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-[#05070B] flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-[#FF4B6A] mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Autenticação necessária</h2>
          <p className="text-[#A9B2C7]">Faça login para acessar a área de vendedor</p>
        </div>
      </div>
    );
  }

  const formatPrice = (price) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);

  const statusLabels = {
    draft: { label: 'Rascunho', color: 'text-[#A9B2C7]' },
    active: { label: 'Ativo', color: 'text-[#10B981]' },
    reserved: { label: 'Reservado', color: 'text-[#F7CE46]' },
    sold: { label: 'Vendido', color: 'text-[#10B981]' },
    expired: { label: 'Expirado', color: 'text-[#FF4B6A]' },
    cancelled: { label: 'Cancelado', color: 'text-[#FF4B6A]' }
  };

  return (
    <div className="min-h-screen bg-[#05070B] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Vender ALZ</h1>

        {/* Profile Section */}
        <div className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Perfil de Vendedor</h2>
            <button
              onClick={() => {
                if (profile) {
                  setProfileData({
                    full_name: profile.full_name,
                    cpf: profile.cpf,
                    efi_pix_key: profile.efi_pix_key
                  });
                }
                setShowProfileForm(true);
              }}
              className="px-4 py-2 bg-[#19E0FF]/20 text-[#19E0FF] rounded hover:bg-[#19E0FF]/30"
            >
              {profile ? 'Editar' : 'Completar Cadastro'}
            </button>
          </div>

          {loadingProfile ? (
            <Skeleton className="h-24 bg-[#19E0FF]/10" />
          ) : profile ? (
            <div className="space-y-2">
              <p className="text-sm text-[#A9B2C7]">Nome: <span className="text-white">{profile.full_name || 'Não informado'}</span></p>
              {profile.cpf && <p className="text-sm text-[#A9B2C7]">CPF: <span className="text-white">{profile.cpf}</span></p>}
              <p className="text-sm text-[#A9B2C7]">Chave PIX (EFI): <span className="text-white">{profile.efi_pix_key || 'Não configurada'}</span></p>
              <p className="text-sm text-[#A9B2C7]">
                Status: <span className={profile.efi_onboarding_status === 'verified' ? 'text-[#10B981]' : 'text-[#F7CE46]'}>
                  {profile.efi_onboarding_status === 'verified' ? 'Verificado' : 'Pendente'}
                </span>
              </p>
            </div>
          ) : (
            <div>
              <p className="text-[#A9B2C7] mb-3">Complete seu perfil para começar a vender</p>
              <div className="p-3 bg-[#F7CE46]/10 border border-[#F7CE46]/20 rounded">
                <p className="text-sm text-[#F7CE46]">
                  ⚠️ Você precisa configurar sua chave PIX para receber pagamentos
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Listings Section */}
        {profile && (
          <div className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Meus Anúncios</h2>
              <button
                onClick={() => setShowListingForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] text-[#05070B] font-bold rounded-lg"
              >
                <Plus className="w-5 h-5" />
                Criar Anúncio
              </button>
            </div>

            {loadingListings ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24 bg-[#19E0FF]/10" />
                ))}
              </div>
            ) : !listings || listings.length === 0 ? (
              <p className="text-center text-[#A9B2C7] py-8">Você ainda não tem anúncios</p>
            ) : (
              <div className="space-y-4">
                {listings.map(listing => (
                  <div key={listing.id} className="bg-[#05070B] border border-[#19E0FF]/10 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="text-white font-semibold">{(listing.alz_amount / 1000000000).toFixed(2)}B ALZ</p>
                          <span className={`text-sm ${statusLabels[listing.status].color}`}>
                            {statusLabels[listing.status].label}
                          </span>
                        </div>
                        <p className="text-sm text-[#A9B2C7]">
                          Preço: {formatPrice(listing.price_brl)} • Personagem: {listing.seller_character_name}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {listing.status === 'draft' && (
                          <button
                            onClick={() => {
                              setSelectedListing(listing);
                              setShowLockModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-[#10B981]/20 text-[#10B981] rounded hover:bg-[#10B981]/30"
                          >
                            <Lock className="w-4 h-4" />
                            Travar ALZ
                          </button>
                        )}
                        {(listing.status === 'active' || listing.status === 'draft') && (
                          <button
                            onClick={() => {
                              if (confirm('Deseja realmente cancelar este anúncio?')) {
                                cancelListingMutation.mutate(listing.listing_id);
                              }
                            }}
                            className="px-4 py-2 bg-[#FF4B6A]/20 text-[#FF4B6A] rounded hover:bg-[#FF4B6A]/30"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Form Modal */}
        <Dialog open={showProfileForm} onOpenChange={setShowProfileForm}>
          <DialogContent className="bg-[#0C121C] border-[#19E0FF]/20">
            <DialogHeader>
              <DialogTitle className="text-white">Perfil de Vendedor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#A9B2C7] mb-2">Nome Completo</label>
                <Input
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                  className="bg-[#05070B] border-[#19E0FF]/20 text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-[#A9B2C7] mb-2">CPF</label>
                <Input
                  value={profileData.cpf}
                  onChange={(e) => setProfileData({ ...profileData, cpf: e.target.value })}
                  className="bg-[#05070B] border-[#19E0FF]/20 text-white"
                  placeholder="000.000.000-00"
                />
              </div>
              <div>
                <label className="block text-sm text-[#A9B2C7] mb-2">Chave PIX (EFI)</label>
                <Input
                  value={profileData.efi_pix_key}
                  onChange={(e) => setProfileData({ ...profileData, efi_pix_key: e.target.value })}
                  className="bg-[#05070B] border-[#19E0FF]/20 text-white"
                  placeholder="email@exemplo.com ou CPF"
                />
              </div>
              <button
                onClick={() => saveProfileMutation.mutate()}
                disabled={saveProfileMutation.isPending || !profileData.full_name || !profileData.cpf || !profileData.efi_pix_key}
                className="w-full px-6 py-3 bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] text-[#05070B] font-bold rounded-lg disabled:opacity-50"
              >
                {saveProfileMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Salvar'}
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Listing Form Modal */}
        <Dialog open={showListingForm} onOpenChange={setShowListingForm}>
          <DialogContent className="bg-[#0C121C] border-[#19E0FF]/20">
            <DialogHeader>
              <DialogTitle className="text-white">Criar Anúncio</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#A9B2C7] mb-2">Nome do Personagem</label>
                <Input
                  value={listingData.seller_character_name}
                  onChange={(e) => setListingData({ ...listingData, seller_character_name: e.target.value })}
                  className="bg-[#05070B] border-[#19E0FF]/20 text-white"
                  placeholder="SeuPersonagem"
                />
              </div>
              <div>
                <label className="block text-sm text-[#A9B2C7] mb-2">Quantidade de ALZ</label>
                <Input
                  type="number"
                  value={listingData.alz_amount}
                  onChange={(e) => setListingData({ ...listingData, alz_amount: e.target.value })}
                  className="bg-[#05070B] border-[#19E0FF]/20 text-white"
                  placeholder="5000000000"
                />
              </div>
              <div>
                <label className="block text-sm text-[#A9B2C7] mb-2">Preço (BRL)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={listingData.price_brl}
                  onChange={(e) => setListingData({ ...listingData, price_brl: e.target.value })}
                  className="bg-[#05070B] border-[#19E0FF]/20 text-white"
                  placeholder="150.00"
                />
                {listingData.price_brl && config?.config?.market_fee_percent && (
                  <div className="mt-2 p-3 bg-[#10B981]/10 border border-[#10B981]/20 rounded">
                    <p className="text-sm text-[#10B981]">
                      Você receberá: <strong>
                        R$ {(parseFloat(listingData.price_brl) * (1 - config.config.market_fee_percent / 100)).toFixed(2)}
                      </strong> após taxa do marketplace ({config.config.market_fee_percent}%)
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={() => createListingMutation.mutate()}
                disabled={createListingMutation.isPending || !listingData.seller_character_name || !listingData.alz_amount || !listingData.price_brl}
                className="w-full px-6 py-3 bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] text-[#05070B] font-bold rounded-lg disabled:opacity-50"
              >
                {createListingMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Criar Anúncio'}
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Lock ALZ Modal */}
        <Dialog open={showLockModal} onOpenChange={setShowLockModal}>
          <DialogContent className="bg-[#0C121C] border-[#F7CE46]/40">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <Shield className="w-6 h-6 text-[#F7CE46]" />
                Travar ALZ
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-[#A9B2C7]">
                Confirme que você <strong className="text-white">deslogou do jogo</strong>. Ao continuar, os ALZ serão removidos do personagem e travados no sistema.
              </p>
              <div className="flex items-start gap-3">
                <Checkbox checked={isOffline} onCheckedChange={setIsOffline} />
                <label className="text-sm text-[#A9B2C7]">
                  Estou offline no jogo agora
                </label>
              </div>
              <button
                onClick={() => {
                  if (selectedListing) {
                    lockAlzMutation.mutate({
                      listingId: selectedListing.listing_id,
                      idempotencyKey: `lock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                    });
                  }
                }}
                disabled={!isOffline || lockAlzMutation.isPending}
                className="w-full px-6 py-3 bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-bold rounded-lg disabled:opacity-50"
              >
                {lockAlzMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Confirmar e Travar'}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}