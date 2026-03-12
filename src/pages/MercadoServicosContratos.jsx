import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, ShoppingBag, Briefcase } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthProvider';
import RequireAuth from '@/components/auth/RequireAuth';
import SectionTitle from '@/components/ui/SectionTitle';
import GlowCard from '@/components/ui/GlowCard';
import MetalButton from '@/components/ui/MetalButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const statusLabels = {
  PENDING_PAYMENT: { label: 'Aguardando pagamento', color: 'bg-yellow-500/20 text-yellow-400' },
  PAID: { label: 'Pago', color: 'bg-blue-500/20 text-blue-400' },
  IN_PROGRESS: { label: 'Em andamento', color: 'bg-purple-500/20 text-purple-400' },
  COMPLETED: { label: 'Concluído', color: 'bg-green-500/20 text-green-400' },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-500/20 text-red-400' },
  DISPUTE_OPEN: { label: 'Em disputa', color: 'bg-orange-500/20 text-orange-400' },
  DISPUTE_RESOLVED: { label: 'Disputa resolvida', color: 'bg-gray-500/20 text-gray-400' }
};

export default function MercadoServicosContratos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contracts, setContracts] = useState({ as_buyer: [], as_provider: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadContracts();
    }
  }, [user]);

  const loadContracts = async () => {
    try {
      const response = await base44.functions.invoke('service_getMyContracts', {});
      if (response.data && response.data.success) {
        setContracts({
          as_buyer: response.data.as_buyer || [],
          as_provider: response.data.as_provider || []
        });
      }
    } catch (e) {
      console.error('Erro ao carregar contratos:', e);
    } finally {
      setLoading(false);
    }
  };

  const renderContractRow = (contract) => {
    const statusInfo = statusLabels[contract.status] || statusLabels.PENDING_PAYMENT;
    const price = contract.payment_type === 'BRL' 
      ? `R$ ${contract.price_brl?.toFixed(2) || '0.00'}`
      : `${contract.price_cash || 0} cash`;

    return (
      <motion.div
        key={contract.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <GlowCard className="p-5">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-white font-bold mb-1">{contract.offer_title}</h3>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-[#A9B2C7]">
                  {contract.role === 'buyer' ? 'Prestador:' : 'Cliente:'} {contract.other_user_name}
                </span>
                <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-white font-bold">{price}</div>
                <div className="text-[#A9B2C7] text-xs">
                  {new Date(contract.created_date).toLocaleDateString('pt-BR')}
                </div>
              </div>
              <MetalButton
                size="sm"
                variant="secondary"
                onClick={() => navigate(`/mercado/servicos/contrato/${contract.id}`)}
              >
                Ver contrato
              </MetalButton>
            </div>
          </div>
        </GlowCard>
      </motion.div>
    );
  };

  return (
    <RequireAuth>
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <SectionTitle 
          title="Meus Contratos de Serviços"
          subtitle="Acompanhe os serviços contratados e oferecidos"
        />

        <Tabs defaultValue="buyer" className="mt-12">
          <TabsList className="bg-[#0C121C] mb-6">
            <TabsTrigger value="buyer" className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Como cliente ({contracts.as_buyer.length})
            </TabsTrigger>
            <TabsTrigger value="provider" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Como prestador ({contracts.as_provider.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="buyer">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24 bg-[#19E0FF]/10 rounded-xl" />
                ))}
              </div>
            ) : contracts.as_buyer.length > 0 ? (
              <div className="space-y-4">
                {contracts.as_buyer.map(renderContractRow)}
              </div>
            ) : (
              <div className="text-center py-16">
                <FileText className="w-16 h-16 text-[#A9B2C7]/30 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Nenhum contrato como cliente</h3>
                <p className="text-[#A9B2C7]">Você ainda não contratou nenhum serviço</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="provider">
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24 bg-[#19E0FF]/10 rounded-xl" />
                ))}
              </div>
            ) : contracts.as_provider.length > 0 ? (
              <div className="space-y-4">
                {contracts.as_provider.map(renderContractRow)}
              </div>
            ) : (
              <div className="text-center py-16">
                <FileText className="w-16 h-16 text-[#A9B2C7]/30 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Nenhum contrato como prestador</h3>
                <p className="text-[#A9B2C7]">Você ainda não recebeu contratações</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </RequireAuth>
  );
}