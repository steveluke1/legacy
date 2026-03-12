import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Coins, Gift, Star, Sparkles, Gem, User } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import CrystalBorder from '@/components/ui/CrystalBorder';
import MetalButton from '@/components/ui/MetalButton';
import SectionTitle from '@/components/ui/SectionTitle';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const streamerPackages = [
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
  }
];

export default function MinhaContaLoja() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userAccount, setUserAccount] = useState(null);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState({});
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [activeTab, setActiveTab] = useState('cartoes');

  useEffect(() => {
    checkAuth();
    loadProducts();
    loadInventory();
  }, []);

  const checkAuth = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        navigate('/login?from_url=/minha-conta/loja');
        return;
      }
      const userData = await base44.auth.me();
      setUser(userData);
      await loadUserAccount(userData.id);
    } catch (e) {
      navigate('/login');
    }
  };

  const loadUserAccount = async (userId) => {
    try {
      const accounts = await base44.entities.UserAccount.filter({ user_id: userId });
      if (accounts.length > 0) {
        setUserAccount(accounts[0]);
      }
    } catch (e) {
      console.error('Erro ao carregar conta:', e);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await base44.functions.invoke('store_getGiftCards', {});
      if (response.data && response.data.success) {
        setProducts(response.data.products || []);
      }
    } catch (e) {
      console.error('Erro ao carregar produtos:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadInventory = async () => {
    try {
      const response = await base44.functions.invoke('store_getInventory', {});
      if (response.data && response.data.success) {
        setInventory(response.data.inventory || {});
      }
    } catch (e) {
      console.error('Erro ao carregar inventário:', e);
    }
  };

  const handlePurchase = async (productId) => {
    setPurchasing(productId);
    try {
      const response = await base44.functions.invoke('store_purchaseGiftCard', {
        product_id: productId
      });

      if (response.data && response.data.success) {
        toast.success(response.data.message);
        await loadUserAccount(user.id);
        await loadInventory();
      } else {
        toast.error(response.data.error || 'Erro ao comprar cartão');
      }
    } catch (e) {
      console.error('Erro:', e);
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
      toast.info('Em breve você poderá comprar este pacote diretamente pela loja. Aguarde as próximas atualizações.');
    } catch (e) {
      console.error('Erro:', e);
      toast.error('Erro ao processar compra');
    } finally {
      setPurchasing(null);
    }
  };

  const getTierData = (tier) => {
    const tiers = {
      BRONZE: { color: '#CD7F32', label: 'Bronze', crystalTier: 'Bronze Crystal' },
      PRATA: { color: '#C0C0C0', label: 'Prata', crystalTier: 'Silver Crystal' },
      OURO: { color: '#FFD700', label: 'Ouro', crystalTier: 'Legendary Arch-Crystal' }
    };
    return tiers[tier] || tiers.BRONZE;
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-12 w-64 mb-8" />
          <Skeleton className="h-32 w-full mb-8" />
          <div className="grid md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <SectionTitle 
          title="Loja CABAL ZIRON"
          subtitle="Compre itens exclusivos, cartões de presente e pacotes especiais"
          centered={false}
        />

        {/* Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <CrystalBorder tier="Platinum Crystal">
            <div className="p-8 bg-gradient-to-br from-[#19E0FF]/10 to-[#1A9FE8]/5">
              <div className="flex flex-wrap gap-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#19E0FF]/20 flex items-center justify-center">
                    <Coins className="w-8 h-8 text-[#19E0FF]" />
                  </div>
                  <div>
                    <p className="text-[#A9B2C7] text-sm">Fragmentos Cristalinos</p>
                    <p className="text-4xl font-bold text-white">
                      {(userAccount?.crystal_fragments || 0).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-[#F7CE46]/20 flex items-center justify-center">
                    <Gem className="w-8 h-8 text-[#F7CE46]" />
                  </div>
                  <div>
                    <p className="text-[#A9B2C7] text-sm">Saldo CASH</p>
                    <p className="text-4xl font-bold text-[#F7CE46]">
                      {(userAccount?.cash_balance || 0).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CrystalBorder>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-[#0C121C] p-1 rounded-xl mb-8">
            <TabsTrigger 
              value="cartoes"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#19E0FF] data-[state=active]:to-[#1A9FE8] data-[state=active]:text-[#05070B] rounded-lg"
            >
              <Gift className="w-4 h-4" />
              Cartões de Presente
            </TabsTrigger>
            <TabsTrigger 
              value="pacotes"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F7CE46] data-[state=active]:to-[#FFD700] data-[state=active]:text-[#05070B] rounded-lg"
            >
              <Sparkles className="w-4 h-4" />
              Pacotes
            </TabsTrigger>
          </TabsList>

          {/* Cartões Tab */}
          <TabsContent value="cartoes" className="mt-0">
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
                      onClick={() => handlePurchase(product.id)}
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

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto"
            >
              <div className="p-6 bg-[#19E0FF]/10 border border-[#19E0FF]/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <Star className="w-6 h-6 text-[#19E0FF] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-white font-bold mb-3">Sobre os Cartões de Presente</h3>
                    <ul className="text-[#A9B2C7] text-sm space-y-2">
                      <li>• Os cartões de presente ficam vinculados à sua conta CABAL ZIRON.</li>
                      <li>• No futuro, eles poderão ser usados em eventos, sorteios, transferências especiais ou resgate dentro do jogo.</li>
                      <li>• Guarde seus cartões com segurança; eles não são reembolsáveis.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          {/* Pacotes Tab */}
          <TabsContent value="pacotes" className="mt-0">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-white mb-3">Pacotes de Streamers & YouTubers</h2>
              <p className="text-[#A9B2C7] text-lg">
                Escolha um dos pacotes especiais inspirados em criadores de conteúdo fictícios e receba itens exclusivos no jogo.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
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
                        {/* Badge */}
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-[#F7CE46]/20 text-[#F7CE46] border border-[#F7CE46]/30 font-bold">
                            {pkg.badge}
                          </Badge>
                        </div>

                        {/* Streamer Avatar */}
                        <div className="text-center mb-6">
                          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#F7CE46] to-[#FFD700] flex items-center justify-center">
                            <User className="w-12 h-12 text-[#05070B]" />
                          </div>
                          <h3 className="text-xl font-bold text-white mb-1">{pkg.displayName}</h3>
                          <p className="text-[#A9B2C7] text-sm mb-4">{pkg.description}</p>
                        </div>

                        {/* Package Contents */}
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

                          <div className="flex items-center justify-between px-4 py-3 bg-[#0C121C] rounded-lg border border-[#19E0FF]/20">
                            <div className="flex items-center gap-2">
                              <Gift className="w-4 h-4 text-[#1A9FE8]" />
                              <span className="text-[#A9B2C7] text-sm">Caixa:</span>
                            </div>
                            <span className="text-white font-bold text-sm">{pkg.boxType}</span>
                          </div>

                          {/* Price */}
                          <div className="px-4 py-4 bg-gradient-to-r from-[#F7CE46]/20 to-[#FFD700]/10 rounded-lg border border-[#F7CE46]/30 mt-4">
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

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto"
            >
              <div className="p-6 bg-[#F7CE46]/10 border border-[#F7CE46]/30 rounded-lg">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-6 h-6 text-[#F7CE46] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="text-white font-bold mb-3">Sobre os Pacotes de Streamers</h3>
                    <ul className="text-[#A9B2C7] text-sm space-y-2">
                      <li>• Cada pacote combina gemas, fantasia, pet e caixa exclusivos.</li>
                      <li>• Os itens são entregues diretamente na sua conta do jogo após a compra.</li>
                      <li>• Pacotes inspirados em criadores de conteúdo fictícios do universo CABAL ZIRON.</li>
                      <li>• Não é possível trocar ou reembolsar após a compra.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}