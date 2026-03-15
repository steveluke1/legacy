import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, Star, Zap, Calendar, CheckCircle, Coins, DollarSign, TrendingUp, Award, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import CrystalBorder from '@/components/ui/CrystalBorder';
import MetalButton from '@/components/ui/MetalButton';
import SectionTitle from '@/components/ui/SectionTitle';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import RequireAuth from '@/components/auth/RequireAuth';
import LoadingShell from '@/components/ui/LoadingShell';

export default function MinhaContaPremium() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userAccount, setUserAccount] = useState(null);
  const [currentVip, setCurrentVip] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState(null);

  useEffect(() => {
    checkAuth();
    loadPlans();
    loadCurrentVip();
  }, []);

  const checkAuth = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        navigate('/login?from_url=/minha-conta/premium');
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

  const loadPlans = async () => {
    try {
      const response = await base44.functions.invoke('premium_getPlans', {});
      if (response.data && response.data.success) {
        setPlans(response.data.plans || []);
      }
    } catch (e) {
      console.error('Erro ao carregar planos:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentVip = async () => {
    try {
      const response = await base44.functions.invoke('premium_getCurrentVip', {});
      if (response.data && response.data.success) {
        setCurrentVip(response.data.vip);
      }
    } catch (e) {
      console.error('Erro ao carregar VIP:', e);
    }
  };

  const handlePurchaseCash = async (planKey) => {
    setProcessingPlan(`${planKey}_cash`);
    try {
      const response = await base44.functions.invoke('premium_purchaseWithCash', {
        plan_key: planKey
      });

      if (response.data && response.data.success) {
        toast.success(response.data.message);
        await loadCurrentVip();
        await loadUserAccount(user.id);
      } else {
        toast.error(response.data.error || 'Erro ao comprar VIP');
      }
    } catch (e) {
      console.error('Erro:', e);
      toast.error('Erro ao processar compra');
    } finally {
      setProcessingPlan(null);
    }
  };

  const handlePurchaseBRL = async (planKey) => {
    setProcessingPlan(`${planKey}_brl`);
    try {
      const response = await base44.functions.invoke('premium_createPayment', {
        plan_key: planKey
      });

      if (response.data && response.data.success) {
        toast.success('Pagamento iniciado! Simulando...');
        
        setTimeout(async () => {
          const simResponse = await base44.functions.invoke('premium_simulatePayment', {
            transaction_id: response.data.transaction_id
          });

          if (simResponse.data && simResponse.data.success) {
            toast.success(simResponse.data.message);
            await loadCurrentVip();
          } else {
            toast.error('Erro ao processar pagamento');
          }
          setProcessingPlan(null);
        }, 2000);
      } else {
        toast.error('Erro ao criar pagamento');
        setProcessingPlan(null);
      }
    } catch (e) {
      console.error('Erro:', e);
      toast.error('Erro ao processar compra');
      setProcessingPlan(null);
    }
  };

  const getTierData = (key) => {
    const tiers = {
      VIP_SIMPLE: { tier: 'Bronze Crystal', icon: Star, color: '#CD7F32' },
      VIP_MEDIUM: { tier: 'Platinum Crystal', icon: Zap, color: '#E5E4E2' },
      VIP_COMPLETE: { tier: 'Legendary Arch-Crystal', icon: Crown, color: '#FFD700' }
    };
    return tiers[key] || tiers.VIP_SIMPLE;
  };

  if (loading || !user) {
    return (
      <RequireAuth>
        <LoadingShell message="Carregando planos Premium..." fullScreen={false} />
      </RequireAuth>
    );
  }

  const plansOrder = ['VIP_SIMPLE', 'VIP_MEDIUM', 'VIP_COMPLETE'];
  const sortedPlans = plansOrder.map(key => plans.find(p => p.key === key)).filter(Boolean);

  return (
    <RequireAuth>
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-full mb-4">
            <Crown className="w-5 h-5 text-[#FFD700]" />
            <span className="text-[#FFD700] font-bold text-sm">PLANOS EXCLUSIVOS VIP</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Desbloqueie Seu Poder
          </h1>
          <p className="text-xl text-[#A9B2C7] max-w-3xl mx-auto">
            Acelere sua progressão, domine dungeons e conquiste Territory Wars com benefícios exclusivos
          </p>
        </motion.div>

        {/* Current VIP Status */}
        {currentVip && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <CrystalBorder tier="Legendary Arch-Crystal">
              <div className="p-6 bg-gradient-to-r from-[#FFD700]/10 to-[#19E0FF]/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-[#FFD700]/20 flex items-center justify-center">
                      <Crown className="w-8 h-8 text-[#FFD700]" />
                    </div>
                    <div>
                      <Badge className="mb-2 bg-[#FFD700] text-[#05070B] font-bold">
                        ✓ VIP ATIVO
                      </Badge>
                      <h3 className="text-xl font-bold text-white">{currentVip.plan_name}</h3>
                      <p className="text-[#A9B2C7] text-sm">
                        Expira em {new Date(currentVip.expires_at).toLocaleDateString('pt-BR')} 
                        <span className="text-[#19E0FF] font-bold ml-2">
                          ({currentVip.remaining_days} dias restantes)
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CrystalBorder>
          </motion.div>
        )}

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {sortedPlans.map((plan, index) => {
            const isPopular = plan.key === 'VIP_MEDIUM';
            const tierData = getTierData(plan.key);
            const Icon = tierData.icon;
            const isProcessingCash = processingPlan === `${plan.key}_cash`;
            const isProcessingBRL = processingPlan === `${plan.key}_brl`;

            return (
              <motion.div
                key={plan.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={isPopular ? 'lg:scale-105 lg:-mt-4' : ''}
              >
                <div className={`relative ${isPopular ? 'ring-2 ring-[#F7CE46] rounded-2xl' : ''}`}>
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                      <Badge className="bg-gradient-to-r from-[#F7CE46] to-[#FFD700] text-[#05070B] font-bold px-4 py-1 text-sm">
                        ⭐ MAIS POPULAR
                      </Badge>
                    </div>
                  )}
                  
                  <CrystalBorder tier={tierData.tier}>
                    <div className={`p-8 ${isPopular ? 'bg-gradient-to-b from-[#F7CE46]/5 to-transparent' : ''}`}>
                      {/* Header */}
                      <div className="text-center mb-6">
                        <div 
                          className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${tierData.color}20` }}
                        >
                          <Icon className="w-10 h-10" style={{ color: tierData.color }} />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                        <p className="text-[#A9B2C7] text-sm min-h-[40px]">{plan.description}</p>
                      </div>

                      {/* Pricing */}
                      <div className="text-center mb-8">
                        <div className="mb-4">
                          <div className="text-4xl font-bold text-white mb-1">
                            R$ {plan.price_brl}
                          </div>
                          <div className="text-[#A9B2C7] text-sm">por 30 dias</div>
                        </div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#19E0FF]/10 border border-[#19E0FF]/30 rounded-lg">
                          <Coins className="w-4 h-4 text-[#19E0FF]" />
                          <span className="text-[#19E0FF] font-bold text-sm">
                            ou {plan.price_cash.toLocaleString('pt-BR')} Cash
                          </span>
                        </div>
                      </div>

                      {/* Key Benefits */}
                      <div className="space-y-3 mb-8">
                        {plan.key === 'VIP_SIMPLE' && (
                          <>
                            <div className="flex items-center gap-3 p-3 bg-[#0C121C] rounded-lg">
                              <Zap className="w-5 h-5 text-[#19E0FF] flex-shrink-0" />
                              <span className="text-white text-sm font-bold">Bônus EXP 500%</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-[#0C121C] rounded-lg">
                              <TrendingUp className="w-5 h-5 text-[#19E0FF] flex-shrink-0" />
                              <span className="text-white text-sm">Drop 70% aumentado</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-[#0C121C] rounded-lg">
                              <Award className="w-5 h-5 text-[#19E0FF] flex-shrink-0" />
                              <span className="text-white text-sm">4 Itens remotos</span>
                            </div>
                          </>
                        )}
                        {plan.key === 'VIP_MEDIUM' && (
                          <>
                            <div className="flex items-center gap-3 p-3 bg-[#0C121C] rounded-lg border border-[#F7CE46]/30">
                              <Zap className="w-5 h-5 text-[#F7CE46] flex-shrink-0" />
                              <span className="text-white text-sm font-bold">Bônus EXP 500%</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-[#0C121C] rounded-lg border border-[#F7CE46]/30">
                              <Award className="w-5 h-5 text-[#F7CE46] flex-shrink-0" />
                              <span className="text-white text-sm font-bold">10 Itens (30 dias)</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-[#0C121C] rounded-lg border border-[#F7CE46]/30">
                              <Star className="w-5 h-5 text-[#F7CE46] flex-shrink-0" />
                              <span className="text-white text-sm font-bold">Itens Permanentes</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-[#0C121C] rounded-lg border border-[#F7CE46]/30">
                              <Shield className="w-5 h-5 text-[#F7CE46] flex-shrink-0" />
                              <span className="text-white text-sm">Macro BM3 + Buffs</span>
                            </div>
                          </>
                        )}
                        {plan.key === 'VIP_COMPLETE' && (
                          <>
                            <div className="flex items-center gap-3 p-3 bg-[#0C121C] rounded-lg border border-[#FFD700]/30">
                              <Zap className="w-5 h-5 text-[#FFD700] flex-shrink-0" />
                              <span className="text-white text-sm font-bold">Bônus EXP 5000%</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-[#0C121C] rounded-lg border border-[#FFD700]/30">
                              <Crown className="w-5 h-5 text-[#FFD700] flex-shrink-0" />
                              <span className="text-white text-sm font-bold">Canais Premium x6-x10</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-[#0C121C] rounded-lg border border-[#FFD700]/30">
                              <Star className="w-5 h-5 text-[#FFD700] flex-shrink-0" />
                              <span className="text-white text-sm font-bold">Pérola EXP 10000%</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-[#0C121C] rounded-lg border border-[#FFD700]/30">
                              <Award className="w-5 h-5 text-[#FFD700] flex-shrink-0" />
                              <span className="text-white text-sm">Itens Permanentes + Tudo do Platina</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* CTA Buttons */}
                      <div className="space-y-3">
                        <MetalButton
                          onClick={() => handlePurchaseBRL(plan.key)}
                          disabled={isProcessingBRL || isProcessingCash}
                          loading={isProcessingBRL}
                          className="w-full"
                          variant={isPopular ? "honor" : "primary"}
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          Comprar em R$
                        </MetalButton>
                        <MetalButton
                          onClick={() => handlePurchaseCash(plan.key)}
                          disabled={isProcessingBRL || isProcessingCash}
                          loading={isProcessingCash}
                          className="w-full"
                          variant="secondary"
                        >
                          <Coins className="w-4 h-4 mr-2" />
                          Comprar com Cash
                        </MetalButton>
                      </div>

                      {isPopular && (
                        <div className="mt-4 text-center">
                          <p className="text-[#F7CE46] text-xs font-bold">
                            Melhor custo-benefício
                          </p>
                        </div>
                      )}
                    </div>
                  </CrystalBorder>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-8">Comparação Detalhada</h2>
          <div className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#19E0FF]/10 border-b border-[#19E0FF]/20">
                    <th className="p-4 text-left text-white font-bold">Benefício</th>
                    <th className="p-4 text-center text-white font-bold">VIP Cristal</th>
                    <th className="p-4 text-center text-white font-bold bg-[#F7CE46]/10">VIP Platina</th>
                    <th className="p-4 text-center text-white font-bold">VIP Myth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#19E0FF]/10">
                  <tr>
                    <td className="p-4 text-[#A9B2C7]">Bônus de EXP</td>
                    <td className="p-4 text-center text-white">500%</td>
                    <td className="p-4 text-center text-white bg-[#F7CE46]/5">500%</td>
                    <td className="p-4 text-center text-[#FFD700] font-bold">5000%</td>
                  </tr>
                  <tr>
                    <td className="p-4 text-[#A9B2C7]">Aumento de Drop</td>
                    <td className="p-4 text-center text-white">70%</td>
                    <td className="p-4 text-center text-white bg-[#F7CE46]/5">70%</td>
                    <td className="p-4 text-center text-white">70%</td>
                  </tr>
                  <tr>
                    <td className="p-4 text-[#A9B2C7]">Itens de 30 dias</td>
                    <td className="p-4 text-center text-white">4</td>
                    <td className="p-4 text-center text-white bg-[#F7CE46]/5">10</td>
                    <td className="p-4 text-center text-white">10</td>
                  </tr>
                  <tr>
                    <td className="p-4 text-[#A9B2C7]">Itens Permanentes</td>
                    <td className="p-4 text-center text-[#A9B2C7]">—</td>
                    <td className="p-4 text-center bg-[#F7CE46]/5">
                      <CheckCircle className="w-5 h-5 text-[#19E0FF] mx-auto" />
                    </td>
                    <td className="p-4 text-center">
                      <CheckCircle className="w-5 h-5 text-[#19E0FF] mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 text-[#A9B2C7]">Macro BM3</td>
                    <td className="p-4 text-center text-[#A9B2C7]">—</td>
                    <td className="p-4 text-center bg-[#F7CE46]/5">
                      <CheckCircle className="w-5 h-5 text-[#19E0FF] mx-auto" />
                    </td>
                    <td className="p-4 text-center">
                      <CheckCircle className="w-5 h-5 text-[#19E0FF] mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 text-[#A9B2C7]">Canais Premium (Drops x6-x10)</td>
                    <td className="p-4 text-center text-[#A9B2C7]">—</td>
                    <td className="p-4 text-center text-[#A9B2C7] bg-[#F7CE46]/5">—</td>
                    <td className="p-4 text-center">
                      <CheckCircle className="w-5 h-5 text-[#FFD700] mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="p-4 text-[#A9B2C7]">Pérola EXP 10000%</td>
                    <td className="p-4 text-center text-[#A9B2C7]">—</td>
                    <td className="p-4 text-center text-[#A9B2C7] bg-[#F7CE46]/5">—</td>
                    <td className="p-4 text-center">
                      <CheckCircle className="w-5 h-5 text-[#FFD700] mx-auto" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* Testimonials / Social Proof */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 bg-[#19E0FF]/10 border border-[#19E0FF]/30 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="w-5 h-5 text-[#FFD700]" />
                <span className="text-white font-bold">+500 VIPs Ativos</span>
              </div>
              <p className="text-[#A9B2C7] text-sm">
                Centenas de jogadores já dominam Nevareth com nossos planos VIP
              </p>
            </div>
            <div className="p-6 bg-[#19E0FF]/10 border border-[#19E0FF]/30 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-[#19E0FF]" />
                <span className="text-white font-bold">Pagamento Seguro</span>
              </div>
              <p className="text-[#A9B2C7] text-sm">
                Compre com total segurança via Mercado Pago ou Cash Ziron
              </p>
            </div>
            <div className="p-6 bg-[#19E0FF]/10 border border-[#19E0FF]/30 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-[#F7CE46]" />
                <span className="text-white font-bold">Ativação Instantânea</span>
              </div>
              <p className="text-[#A9B2C7] text-sm">
                Benefícios aplicados imediatamente após confirmação do pagamento
              </p>
            </div>
          </div>
        </motion.div>

        {/* FAQ / Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="p-8 bg-[#0C121C] border border-[#19E0FF]/20 rounded-xl">
            <h3 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
              <Award className="w-6 h-6 text-[#19E0FF]" />
              Perguntas Frequentes
            </h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-white font-bold mb-1">Quando os benefícios são ativados?</p>
                <p className="text-[#A9B2C7]">
                  Imediatamente após a confirmação do pagamento. Você receberá todos os itens e bônus automaticamente.
                </p>
              </div>
              <div>
                <p className="text-white font-bold mb-1">Posso acumular VIPs?</p>
                <p className="text-[#A9B2C7]">
                  Sim! Se você já tem um VIP ativo, o novo período será adicionado ao final do atual.
                </p>
              </div>
              <div>
                <p className="text-white font-bold mb-1">Qual a diferença entre comprar com R$ ou Cash?</p>
                <p className="text-[#A9B2C7]">
                  Os benefícios são os mesmos. A diferença está no método de pagamento: R$ via gateway externo ou Cash que você já possui na conta.
                </p>
              </div>
              <div className="pt-4 border-t border-[#19E0FF]/20">
                <p className="text-[#A9B2C7]">
                  • Todos os benefícios são válidos apenas no servidor CABAL ZIRON<br/>
                  • VIPs têm duração de 30 dias e podem ser renovados<br/>
                  • Saldo de Cash atual: <strong className="text-[#19E0FF]">{(userAccount?.crystal_fragments || 0).toLocaleString('pt-BR')} Cash</strong>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
    </RequireAuth>
  );
}