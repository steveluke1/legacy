// UI-ONLY EXPORT - Loja Page
// Base44 dependencies removed - ready for Next.js migration

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Crown, Gift, AlertTriangle, RefreshCw } from 'lucide-react';
import { RequireAuth, useAuth } from '@/components/ui_export_stubs/auth';
import { getStoreData, getUserAccount } from '@/components/ui_export_stubs/data';
import CrystalBorder from '@/components/ui/CrystalBorder';
import MetalButton from '@/components/ui/MetalButton';
import SectionTitle from '@/components/ui/SectionTitle';
import LoadingShell from '@/components/ui/LoadingShell';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import PremiumPlanCard from '@/components/loja/PremiumPlanCard';
import PremiumComparisonTable from '@/components/loja/PremiumComparisonTable';
import { premiumPlans } from '@/components/loja/PremiumPlansData';
import CaixaInsigniasCard from '@/components/loja/CaixaInsigniasCard';
import StreamerPackagesSection from '@/components/loja/StreamerPackagesSection';

export default function LojaExport() {
  const { user } = useAuth();
  const [purchasing, setPurchasing] = useState(null);
  const [processingPlan, setProcessingPlan] = useState(null);
  const [activeTab, setActiveTab] = useState('loja');
  const [loading, setLoading] = useState(true);
  const [storeData, setStoreData] = useState(null);
  const [userAccount, setUserAccount] = useState(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [store, account] = await Promise.all([
        getStoreData(),
        getUserAccount(user.id)
      ]);
      setStoreData(store);
      setUserAccount(account);
    } catch (e) {
      console.error('Erro ao carregar dados:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseGiftCard = async (productId) => {
    setPurchasing(productId);
    try {
      // STUB: Simular compra
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Produto comprado com sucesso!');
      loadData();
    } catch (e) {
      toast.error('Erro ao comprar cartão');
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

  if (loading || !storeData) {
    return (
      <RequireAuth>
        <LoadingShell message="Carregando loja..." fullScreen={false} />
      </RequireAuth>
    );
  }

  const { products, plans, currentVip, inventory } = storeData;

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
          <TabsContent value="loja" className="mt-0">
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
          </TabsContent>

          {/* Premium & VIP Tab */}
          <TabsContent value="premium" className="mt-0">
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