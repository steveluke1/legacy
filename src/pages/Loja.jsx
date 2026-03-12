import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Crown, Coins, Gift, Star, Sparkles, Gem, User as UserIcon, AlertTriangle, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import RequireAuth from '@/components/auth/RequireAuth';
import { useAuth } from '@/components/auth/AuthProvider';
import CrystalBorder from '@/components/ui/CrystalBorder';
import MetalButton from '@/components/ui/MetalButton';
import SectionTitle from '@/components/ui/SectionTitle';
import LoadingShell from '@/components/ui/LoadingShell';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import PremiumPlanCard from '@/components/loja/PremiumPlanCard';
import PremiumComparisonTable from '@/components/loja/PremiumComparisonTable';
import { premiumPlans } from '@/components/loja/PremiumPlansData';
import CaixaInsigniasCard from '@/components/loja/CaixaInsigniasCard';
import StreamerPackagesSection from '@/components/loja/StreamerPackagesSection';

// DISABLED: Fictional streamer packages removed in production
// Real streamer packages must be configured via backend and persisted
const streamerPackages = [
  /* DISABLED - Example kept for reference only
  {
    id: 'pacote_zironlive',
    streamerName: 'ZironLive',
    displayName: 'Pacote Streamer ZironLive',
    description: 'Pacote inspirado no streamer fictício ZironLive, focado em jogadores que querem começar forte no servidor.',
    gemAmount: 50,
    fantasyType: 'Asa',
    pet: 'Suricato',
    boxType: 'Caixa de Yul',
    priceValue: 9900,
    priceCurrency: 'CASH',
    badge: 'Popular'
  },
  {
    id: 'pacote_nightblade',
    streamerName: 'NightBladeTV',
    displayName: 'Pacote Streamer NightBlade',
    description: 'Pacote inspirado no streamer fictício NightBlade, ideal para quem busca equipamentos completos e pets exclusivos.',
    gemAmount: 100,
    fantasyType: 'Corpo',
    pet: 'Armadilho',
    boxType: 'Caixa de Proteção',
    priceValue: 19900,
    priceCurrency: 'CASH',
    badge: 'Mais vendido'
  },
  {
    id: 'pacote_nebulacabal',
    streamerName: 'NebulaCabal',
    displayName: 'Pacote Streamer Nebula',
    description: 'Pacote premium inspirado na streamer fictícia Nebula, com a melhor combinação de itens para dominar Nevareth.',
    gemAmount: 200,
    fantasyType: 'Moto',
    pet: 'Lebrecorne',
    boxType: 'Caixa de Veradrix',
    priceValue: 29900,
    priceCurrency: 'CASH',
    badge: 'Novo'
  },
  {
    id: 'pacote_caballegend',
    streamerName: 'CabalLegend',
    displayName: 'Pacote Streamer CabalLegend',
    description: 'Pacote inspirado no lendário streamer CabalLegend, perfeito para jogadores que buscam performance.',
    gemAmount: 100,
    fantasyType: 'Corpo',
    pet: 'Lebrecorne',
    boxType: 'Caixa de Yul',
    priceValue: 24900,
    priceCurrency: 'CASH',
    badge: 'Exclusivo'
  },
  {
    id: 'pacote_tgmaster',
    streamerName: 'TGMaster',
    displayName: 'Pacote Streamer TGMaster',
    description: 'Pacote inspirado no mestre das Territory Wars, ideal para dominadores de TG.',
    gemAmount: 50,
    fantasyType: 'Arma',
    pet: 'Armadilho',
    boxType: 'Caixa de Proteção',
    priceValue: 19900,
    priceCurrency: 'CASH',
    badge: 'TG Focus'
  },
  {
    id: 'pacote_dungeonpro',
    streamerName: 'DungeonPro',
    displayName: 'Pacote Streamer DungeonPro',
    description: 'Pacote premium inspirado no especialista em dungeons, com os melhores itens para desbravadores.',
    gemAmount: 200,
    fantasyType: 'Asa',
    pet: 'Suricato',
    boxType: 'Caixa de Veradrix',
    priceValue: 34900,
    priceCurrency: 'CASH',
    badge: 'Premium'
  }
  */
];  // Empty in production - real packages via backend only

export default function Loja() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [purchasing, setPurchasing] = useState(null);
  const [processingPlan, setProcessingPlan] = useState(null);
  const [activeTab, setActiveTab] = useState('loja');

  // Fetch user account with React Query
  const { data: userAccount } = useQuery({
    queryKey: ['userAccount', user?.id],
    queryFn: async () => {
      // Get token from localStorage for custom auth
      const token = localStorage.getItem('lon_auth_token');
      if (!token) {
        return null;
      }

      // Use backend function instead of direct entity access
      const response = await base44.functions.invoke('walletGetUserAccount', { token });
      return response.data?.success ? response.data.account : null;
    },
    enabled: !!user,
    staleTime: 30000,
    retry: 1
  });

  // Fetch store data with React Query
  const { data: storeData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['storeData'],
    queryFn: async () => {
      // Get token from localStorage for custom auth
      const token = localStorage.getItem('lon_auth_token');
      
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
      );

      const fetchData = Promise.all([
        base44.functions.invoke('storeGetGiftCards', {}).catch(() => ({ data: { success: false, products: [] } })),
        base44.functions.invoke('premiumGetPlans', {}).catch(() => ({ data: { success: false, plans: [] } })),
        base44.functions.invoke('premiumGetCurrentVip', { token }).catch(() => ({ data: { success: false, vip: null } })),
        base44.functions.invoke('storeGetInventory', { token }).catch(() => ({ data: { success: false, inventory: {} } }))
      ]);

      const [productsRes, plansRes, vipRes, inventoryRes] = await Promise.race([fetchData, timeout]);

      return {
        products: productsRes.data?.products || [],
        plans: plansRes.data?.plans || [],
        currentVip: vipRes.data?.vip || null,
        inventory: inventoryRes.data?.inventory || {}
      };
    },
    enabled: !!user,
    staleTime: 60000,
    retry: 1,
    refetchOnWindowFocus: false
  });

  const handlePurchaseGiftCard = async (productId) => {
    setPurchasing(productId);
    try {
      const response = await base44.functions.invoke('store_purchaseGiftCard', { product_id: productId });
      if (response.data?.success) {
        toast.success(response.data.message);
        refetch();
      } else {
        toast.error(response.data.error || 'Erro ao comprar cartão');
      }
    } catch (e) {
      toast.error('Erro ao processar compra');
    } finally {
      setPurchasing(null);
    }
  };

  const handlePurchaseStreamerPackage = async (packageId) => {
    const selectedPackage = streamerPackages.find(p => p.id === packageId);
    if (!selectedPackage) return;

    if (!userAccount || userAccount.cash_balance < selectedPackage.priceValue) {
      toast.error(`Saldo insuficiente. Você precisa de ${selectedPackage.priceValue.toLocaleString('pt-BR')} CASH`);
      return;
    }

    setPurchasing(packageId);
    try {
      toast.info('Em breve você poderá comprar este pacote diretamente pela loja.');
    } finally {
      setPurchasing(null);
    }
  };

  const handlePurchasePremiumCash = async (planKey) => {
    setProcessingPlan(`${planKey}_cash`);
    toast.info('Em breve você poderá ativar este plano Premium diretamente pelo portal.');
    setTimeout(() => setProcessingPlan(null), 1500);
  };

  const handlePurchasePremiumBRL = async (planKey) => {
    setProcessingPlan(`${planKey}_brl`);
    toast.info('Em breve você poderá ativar este plano Premium diretamente pelo portal.');
    setTimeout(() => setProcessingPlan(null), 1500);
  };

  const getTierData = (tier) => {
    const tiers = {
      BRONZE: { color: '#CD7F32', label: 'Bronze', crystalTier: 'Bronze Crystal' },
      PRATA: { color: '#C0C0C0', label: 'Prata', crystalTier: 'Silver Crystal' },
      OURO: { color: '#FFD700', label: 'Ouro', crystalTier: 'Legendary Arch-Crystal' }
    };
    return tiers[tier] || tiers.BRONZE;
  };

  const getVipTierData = (key) => {
    const tiers = {
      VIP_SIMPLE: { tier: 'Bronze Crystal', icon: Star, color: '#CD7F32' },
      VIP_MEDIUM: { tier: 'Platinum Crystal', icon: Zap, color: '#E5E4E2' },
      VIP_COMPLETE: { tier: 'Legendary Arch-Crystal', icon: Crown, color: '#FFD700' }
    };
    return tiers[key] || tiers.VIP_SIMPLE;
  };

  // Error state
  if (isError) {
    return (
      <RequireAuth>
        <div className="min-h-screen py-20 px-4 flex items-center justify-center">
          <div className="max-w-md text-center">
            <AlertTriangle className="w-16 h-16 text-[#FF4B6A] mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Erro ao carregar loja</h2>
            <p className="text-[#A9B2C7] mb-6">
              {error?.message || 'Não foi possível carregar os dados da loja'}
            </p>
            <MetalButton onClick={() => refetch()} className="mx-auto">
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar novamente
            </MetalButton>
          </div>
        </div>
      </RequireAuth>
    );
  }

  // Loading state
  if (isLoading || !user || !storeData) {
    return (
      <RequireAuth>
        <LoadingShell message="Carregando loja..." fullScreen={false} />
      </RequireAuth>
    );
  }

  const { products, plans, currentVip, inventory } = storeData;
  const plansOrder = ['VIP_SIMPLE', 'VIP_MEDIUM', 'VIP_COMPLETE'];
  const sortedPlans = plansOrder.map(key => plans.find(p => p.key === key)).filter(Boolean);

  return (
    <RequireAuth>
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <SectionTitle 
          title="Loja do Portal"
          centered={false}
        />



        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#0C121C] p-1 rounded-xl mb-8">
            <TabsTrigger 
              value="loja"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#19E0FF] data-[state=active]:to-[#1A9FE8] data-[state=active]:text-[#05070B] rounded-lg"
            >
              <ShoppingBag className="w-4 h-4" />
              Loja
            </TabsTrigger>
            <TabsTrigger 
              value="premium"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F7CE46] data-[state=active]:to-[#FFD700] data-[state=active]:text-[#05070B] rounded-lg"
            >
              <Crown className="w-4 h-4" />
              Premium & VIP
            </TabsTrigger>
          </TabsList>

          {/* Loja Tab */}
          <TabsContent value="loja" className="mt-0" forceMount={activeTab === 'loja'}>
            {/* Caixas Section */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-2">Caixas Especiais</h2>
              <p className="text-[#A9B2C7] mb-6">
                Abra caixas e desbloqueie itens exclusivos para o seu personagem.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <CaixaInsigniasCard />
              </div>
            </div>

            {/* Streamer Packages Section */}
            <StreamerPackagesSection userAccount={userAccount} />


            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Gift Cards</h2>
              <p className="text-[#A9B2C7]">Cartões presenteáveis de Fragmentos Cristalinos</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {/* Produto Especial - Invisível no Rank */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
              >
                <CrystalBorder tier="Legendary Arch-Crystal" showLabel>
                  <div className="p-6 h-full flex flex-col">
                    <div className="text-center mb-6">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                        <svg 
                          className="w-12 h-12 text-white"
                          viewBox="0 0 24 24" 
                          fill="currentColor"
                        >
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-1.85.63-3.55 1.69-4.9L16.9 18.31C15.55 19.37 13.85 20 12 20zm6.31-3.1L7.1 5.69C8.45 4.63 10.15 4 12 4c4.41 0 8 3.59 8 8 0 1.85-.63 3.55-1.69 4.9z"/>
                        </svg>
                      </div>
                      <Badge className="mb-3 bg-[#19E0FF]/20 text-[#19E0FF] border border-[#19E0FF]/30 font-bold">
                        EXCLUSIVO
                      </Badge>
                      <h3 className="text-xl font-bold text-white mb-2">Invisível no Rank</h3>
                      <p className="text-[#A9B2C7] text-sm mb-4">Seu set e interna fica invisível no rank por 30 dias!</p>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between px-4 py-2 bg-[#0C121C] rounded-lg border border-[#19E0FF]/20">
                          <span className="text-[#A9B2C7] text-sm">Duração:</span>
                          <span className="text-white font-bold">30 dias</span>
                        </div>
                        <div className="px-4 py-4 bg-gradient-to-r from-[#19E0FF]/20 to-[#1A9FE8]/10 rounded-lg border border-[#19E0FF]/30">
                          <div className="text-center">
                            <span className="text-[#A9B2C7] text-sm block mb-1">Preço:</span>
                            <span className="text-[#19E0FF] font-bold text-2xl">
                              R$ 200,00
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <MetalButton
                      variant="primary"
                      onClick={() => toast.info('Em breve você poderá comprar este item exclusivo!')}
                      className="w-full mt-auto"
                    >
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Comprar
                    </MetalButton>
                  </div>
                </CrystalBorder>
              </motion.div>

              {products.map((product, index) => {
                const tierData = getTierData(product.tier);
                const isPurchasing = purchasing === product.id;
                const owned = inventory[product.tier] || 0;

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <CrystalBorder tier={tierData.crystalTier} showLabel>
                      <div className="p-6 h-full flex flex-col">
                        <div className="text-center mb-6">
                          <div 
                            className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${tierData.color}20` }}
                          >
                            <Gift className="w-10 h-10" style={{ color: tierData.color }} />
                          </div>
                          <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
                          <p className="text-[#A9B2C7] text-sm mb-4">{product.description}</p>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between px-4 py-2 bg-[#0C121C] rounded-lg border border-[#19E0FF]/20">
                              <span className="text-[#A9B2C7] text-sm">Quantidade:</span>
                              <span className="text-white font-bold">{product.quantity}</span>
                            </div>
                            <div className="flex items-center justify-between px-4 py-2 bg-[#0C121C] rounded-lg border border-[#19E0FF]/20">
                              <span className="text-[#A9B2C7] text-sm">Custo:</span>
                              <span className="text-[#19E0FF] font-bold text-lg">
                                {product.price_cash.toLocaleString('pt-BR')} Cash
                              </span>
                            </div>
                          </div>

                          {owned > 0 && (
                            <div className="mt-4">
                              <Badge className="bg-[#19E0FF]/20 text-[#19E0FF] border border-[#19E0FF]/30">
                                Você possui: {owned}
                              </Badge>
                            </div>
                          )}
                        </div>

                        <MetalButton
                          onClick={() => handlePurchaseGiftCard(product.id)}
                          disabled={isPurchasing}
                          loading={isPurchasing}
                          className="w-full mt-auto"
                        >
                          <ShoppingBag className="w-4 h-4 mr-2" />
                          Comprar
                        </MetalButton>
                      </div>
                    </CrystalBorder>
                  </motion.div>
                );
              })}
            </div>

            {/* Pacotes de Streamers - Only show if real packages exist */}
            {streamerPackages.length > 0 && (
              <>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">Pacotes Especiais</h2>
                  <p className="text-[#A9B2C7]">Pacotes exclusivos de parceiros</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  {streamerPackages.map((pkg, index) => {
                    const isPurchasing = purchasing === pkg.id;

                    return (
                      <motion.div
                        key={pkg.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <CrystalBorder tier="Legendary Arch-Crystal" showLabel={false}>
                          <div className="p-6 h-full flex flex-col relative">
                            <div className="absolute top-4 right-4">
                              <Badge className="bg-[#F7CE46]/20 text-[#F7CE46] border border-[#F7CE46]/30 font-bold">
                                {pkg.badge}
                              </Badge>
                            </div>

                            <div className="text-center mb-6">
                              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#F7CE46] to-[#FFD700] flex items-center justify-center">
                                <UserIcon className="w-12 h-12 text-[#05070B]" />
                              </div>
                              <h3 className="text-xl font-bold text-white mb-1">{pkg.displayName}</h3>
                              <p className="text-[#A9B2C7] text-sm mb-4">{pkg.description}</p>
                            </div>

                            <div className="space-y-3 mb-6">
                              <div className="flex items-center justify-between px-4 py-3 bg-[#0C121C] rounded-lg border border-[#19E0FF]/20">
                                <div className="flex items-center gap-2">
                                  <Gem className="w-4 h-4 text-[#19E0FF]" />
                                  <span className="text-[#A9B2C7] text-sm">Gemas:</span>
                                </div>
                                <span className="text-white font-bold">{pkg.gemAmount}</span>
                              </div>

                              <div className="flex items-center justify-between px-4 py-3 bg-[#0C121C] rounded-lg border border-[#19E0FF]/20">
                                <div className="flex items-center gap-2">
                                  <Sparkles className="w-4 h-4 text-[#F7CE46]" />
                                  <span className="text-[#A9B2C7] text-sm">Fantasia:</span>
                                </div>
                                <span className="text-white font-bold">{pkg.fantasyType}</span>
                              </div>

                              <div className="flex items-center justify-between px-4 py-3 bg-[#0C121C] rounded-lg border border-[#19E0FF]/20">
                                <div className="flex items-center gap-2">
                                  <Star className="w-4 h-4 text-[#FF4B6A]" />
                                  <span className="text-[#A9B2C7] text-sm">Pet:</span>
                                </div>
                                <span className="text-white font-bold">{pkg.pet}</span>
                              </div>

                              <div className="px-4 py-4 bg-gradient-to-r from-[#F7CE46]/20 to-[#FFD700]/10 rounded-lg border border-[#F7CE46]/30">
                                <div className="text-center">
                                  <span className="text-[#A9B2C7] text-sm block mb-1">Preço:</span>
                                  <span className="text-[#F7CE46] font-bold text-2xl">
                                    {pkg.priceValue.toLocaleString('pt-BR')} ⬥ CASH
                                  </span>
                                </div>
                              </div>
                            </div>

                            <MetalButton
                              variant="gold"
                              onClick={() => handlePurchaseStreamerPackage(pkg.id)}
                              disabled={isPurchasing}
                              loading={isPurchasing}
                              className="w-full mt-auto"
                            >
                              <ShoppingBag className="w-4 h-4 mr-2" />
                              Comprar pacote
                            </MetalButton>
                          </div>
                        </CrystalBorder>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            )}
          </TabsContent>

          {/* Premium & VIP Tab */}
          <TabsContent value="premium" className="mt-0" forceMount={activeTab === 'premium'}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-full mb-4">
                <Crown className="w-5 h-5 text-[#FFD700]" />
                <span className="text-[#FFD700] font-bold text-sm">PLANOS EXCLUSIVOS PREMIUM</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Desbloqueie Seu Poder em Nevareth
              </h1>
              <p className="text-lg text-[#A9B2C7] max-w-3xl mx-auto mb-6">
                Acelere sua progressão, domine dungeons e conquiste Territory Wars com benefícios Premium exclusivos
              </p>
              <div className="max-w-4xl mx-auto space-y-3">
                <p className="text-[#19E0FF] font-bold text-lg">
                  🔥 Chega de jogar em desvantagem — ative seu Premium agora
                </p>
                <p className="text-[#A9B2C7] text-sm">
                  Comece hoje no Premium e nunca mais volte ao modo comum • Planos sem fidelidade: você tem total controle • A cada DG, seu Premium trabalha por você
                </p>
              </div>
            </motion.div>

            {/* Premium Plan Cards */}
            <div className="grid lg:grid-cols-3 gap-8 mb-12">
              {premiumPlans.map((plan, index) => (
                <PremiumPlanCard
                  key={plan.key}
                  plan={plan}
                  index={index}
                  onPurchaseCash={handlePurchasePremiumCash}
                  onPurchaseBRL={handlePurchasePremiumBRL}
                  processingPlan={processingPlan}
                />
              ))}
            </div>

            {/* Comparison Table */}
            <PremiumComparisonTable />
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </RequireAuth>
  );
}