import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { DollarSign, Coins, TrendingUp, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthProvider';
import RequireAuth from '@/components/auth/RequireAuth';
import { useQueryClient } from '@tanstack/react-query';
import CrystalBorder from '@/components/ui/CrystalBorder';
import MetalButton from '@/components/ui/MetalButton';
import SectionTitle from '@/components/ui/SectionTitle';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { CASH_BALANCE_QUERY_KEY } from '@/components/hooks/useCashBalance';
import LoadingShell from '@/components/ui/LoadingShell';

export default function MinhaContaDoacao() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [userAccount, setUserAccount] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(null);

  useEffect(() => {
    if (user) {
      loadUserAccount();
      loadPackages();
    }
  }, [user]);

  const loadUserAccount = async () => {
    try {
      const response = await base44.functions.invoke('walletGetUserAccount', {});
      if (response.data?.success) {
        setUserAccount(response.data.account);
      }
    } catch (e) {
      console.error('Erro ao carregar conta:', e);
    }
  };

  const loadPackages = async () => {
    try {
      const response = await base44.functions.invoke('donationGetPackages', {});
      if (response.data && response.data.success) {
        setPackages(response.data.packages || []);
      }
    } catch (e) {
      console.error('Erro ao carregar pacotes:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = async (packageId) => {
    setProcessingPayment(packageId);
    try {
      const response = await base44.functions.invoke('donationCreatePayment', {
        package_id: packageId
      });

      if (response.data && response.data.success) {
        toast.success('Pagamento iniciado! Siga as instruções para concluir via PIX.');
        
        // PRODUCTION: Payment must be confirmed via real webhook only
        toast.info('Aguardando confirmação de pagamento via PIX. Seu CASH será creditado automaticamente após a confirmação.');
        setProcessingPayment(null);
      } else {
        toast.error('Erro ao criar pagamento');
        setProcessingPayment(null);
      }
    } catch (e) {
      console.error('Erro:', e);
      toast.error('Erro ao processar doação');
      setProcessingPayment(null);
    }
  };

  const getPopularBadge = (bonusPercent) => {
    if (bonusPercent >= 20) return 'MELHOR VALOR';
    if (bonusPercent >= 10) return 'POPULAR';
    if (bonusPercent >= 5) return 'BÔNUS';
    return null;
  };

  if (loading || !user) {
    return (
      <RequireAuth>
        <LoadingShell message="Carregando pacotes..." fullScreen={false} />
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <SectionTitle 
          title="Doação"
          subtitle="Converta reais em CASH para apoiar o servidor e receber benefícios dentro do jogo"
          centered={false}
        />

        {/* Current Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <CrystalBorder tier="Platinum Crystal">
            <div className="p-8 bg-gradient-to-br from-[#19E0FF]/10 to-[#1A9FE8]/5">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-[#19E0FF]/20 flex items-center justify-center">
                  <Coins className="w-8 h-8 text-[#19E0FF]" />
                </div>
                <div>
                  <p className="text-[#A9B2C7] text-sm">Seu saldo de CASH</p>
                  <p className="text-4xl font-bold text-white">
                    {(userAccount?.crystal_fragments || 0).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
              <p className="text-[#A9B2C7] text-sm">
                Use Cash para comprar VIP, itens especiais e outras vantagens exclusivas.
              </p>
            </div>
          </CrystalBorder>
        </motion.div>

        {/* Packages Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {packages.map((pkg, index) => {
            const badge = getPopularBadge(pkg.bonus_percent);
            const isProcessing = processingPayment === pkg.id;

            return (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <CrystalBorder tier={badge ? 'Obsidian Crystal' : 'Bronze Crystal'}>
                  <div className="p-6 h-full flex flex-col">
                    {badge && (
                      <Badge className="mb-4 bg-[#F7CE46] text-[#05070B] font-bold">
                        {badge}
                      </Badge>
                    )}

                    <div className="text-center mb-4">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#19E0FF]/20 flex items-center justify-center">
                        <DollarSign className="w-8 h-8 text-[#19E0FF]" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        R$ {pkg.amount_brl.toFixed(2)}
                      </h3>
                      <p className="text-[#A9B2C7] text-sm mb-2">
                        {pkg.base_cash.toLocaleString('pt-BR')} Cash
                      </p>
                      {pkg.bonus_percent > 0 && (
                        <div className="space-y-1">
                          <p className="text-[#F7CE46] text-sm font-bold flex items-center justify-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            Bônus +{pkg.bonus_percent}%
                          </p>
                          <p className="text-white font-bold">
                            Total: {pkg.total_cash.toLocaleString('pt-BR')} Cash
                          </p>
                        </div>
                      )}
                    </div>

                    <MetalButton
                      onClick={() => handleDonate(pkg.id)}
                      disabled={isProcessing}
                      loading={isProcessing}
                      className="w-full mt-auto"
                    >
                      {isProcessing ? 'Processando...' : 'Doar agora'}
                    </MetalButton>

                    <p className="text-[#A9B2C7] text-xs text-center mt-3">
                      Cash creditado automaticamente
                    </p>
                  </div>
                </CrystalBorder>
              </motion.div>
            );
          })}
        </div>

        {/* Legal Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <div className="p-6 bg-[#19E0FF]/10 border border-[#19E0FF]/30 rounded-lg">
            <div className="flex items-start gap-3 mb-4">
              <Shield className="w-6 h-6 text-[#19E0FF] flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-bold mb-2">Informações Importantes</h3>
                <ul className="text-[#A9B2C7] text-sm space-y-2">
                  <li>• As doações são voluntárias e usadas para manter a infraestrutura do servidor Legacy of Nevareth.</li>
                  <li>• O CASH é uma moeda virtual exclusiva deste servidor e não possui valor fora do jogo.</li>
                  <li>• Após a confirmação do pagamento, seu CASH será creditado automaticamente na sua conta.</li>
                  <li>• Ao prosseguir, você concorda com os Termos de Uso e Política de Privacidade.</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
    </RequireAuth>
  );
}