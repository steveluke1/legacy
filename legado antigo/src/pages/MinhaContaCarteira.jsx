import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { authClient } from '@/components/auth/authClient';
import { useAuth } from '@/components/auth/AuthProvider';
import RequireAuth from '@/components/auth/RequireAuth';
import GlowCard from '@/components/ui/GlowCard';
import SectionTitle from '@/components/ui/SectionTitle';
import MetalButton from '@/components/ui/MetalButton';
import { Skeleton } from '@/components/ui/skeleton';
import LoadingShell from '@/components/ui/LoadingShell';

export default function MinhaContaCarteira() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    if (user) {
      loadWalletData();
    }
  }, [user]);

  const loadWalletData = async () => {
    try {
      const token = authClient.getToken();
      if (!token) {
        console.warn('Token not found, cannot load wallet');
        setLoading(false);
        return;
      }
      
      const response = await base44.functions.invoke('wallet_getUserAccount', { token });
      if (response.data && response.data.success) {
        setBalance(response.data.account?.cash_balance || 0);
        setTransactions(response.data.transactions || []);
      }
    } catch (error) {
      console.error('Erro ao carregar carteira:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <LoadingShell message="Carregando carteira..." fullScreen={false} />
    );
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <MetalButton
          variant="secondary"
          onClick={() => navigate('/minha-conta')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </MetalButton>

        <SectionTitle 
          title="Carteira CASH"
          subtitle="Gerencie seu saldo de CASH interno"
          centered={false}
        />

        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 mb-8"
        >
          <GlowCard className="p-8 text-center">
            <Wallet className="w-16 h-16 text-[#19E0FF] mx-auto mb-4" />
            <h2 className="text-[#A9B2C7] text-sm uppercase tracking-wider mb-2">Saldo Atual</h2>
            <div className="text-5xl font-black text-white mb-2">
              {balance.toLocaleString()}
              <span className="text-[#19E0FF] text-3xl ml-2">CASH</span>
            </div>
            <p className="text-[#A9B2C7] text-sm">
              Use CASH para contratar serviços in-game
            </p>
          </GlowCard>
        </motion.div>

        {/* Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#19E0FF]" />
            Histórico de Transações
          </h3>

          <GlowCard className="p-6">
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <Wallet className="w-16 h-16 text-[#A9B2C7]/30 mx-auto mb-4" />
                <p className="text-[#A9B2C7]">Nenhuma transação ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div key={tx.id} className="p-4 bg-[#05070B] rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {tx.direction === 'credit' ? (
                          <TrendingUp className="w-5 h-5 text-green-400" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-400" />
                        )}
                        <div>
                          <p className="text-white font-medium">{tx.reason}</p>
                          <p className="text-[#A9B2C7] text-xs">
                            {new Date(tx.created_date).toLocaleString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${tx.direction === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                          {tx.direction === 'credit' ? '+' : '-'}{tx.amount.toLocaleString()} CASH
                        </p>
                        <p className="text-[#A9B2C7] text-xs">
                          Saldo: {tx.balance_after.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlowCard>
        </motion.div>
      </div>
    </div>
  );
}