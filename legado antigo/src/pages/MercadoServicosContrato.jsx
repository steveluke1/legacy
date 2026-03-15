import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, User, Clock, AlertTriangle, CheckCircle, Star } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthProvider';
import RequireAuth from '@/components/auth/RequireAuth';
import GlowCard from '@/components/ui/GlowCard';
import GradientButton from '@/components/ui/GradientButton';
import MetalButton from '@/components/ui/MetalButton';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import RatingModal from '@/components/mercado/RatingModal';
import ServiceContractTimeline from '@/components/servicos/ServiceContractTimeline';

const statusLabels = {
  PENDING_PAYMENT: 'Aguardando pagamento',
  PAID: 'Pago',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
  DISPUTE_OPEN: 'Em disputa',
  DISPUTE_RESOLVED: 'Disputa resolvida'
};

export default function MercadoServicosContrato() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contract, setContract] = useState(null);
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showRating, setShowRating] = useState(false);

  useEffect(() => {
    if (user) {
      loadContract();
    }
  }, [id, user]);

  const loadContract = async () => {
    try {
      const response = await base44.functions.invoke('service_getContract', { contract_id: id });
      if (response.data && response.data.success) {
        setContract(response.data.contract);
        setOffer(response.data.offer);
      } else {
        toast.error('Contrato não encontrado');
        navigate('/mercado/servicos/contratos');
      }
    } catch (e) {
      console.error('Erro ao carregar contrato:', e);
      toast.error('Erro ao carregar contrato');
      navigate('/mercado/servicos/contratos');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (action) => {
    setUpdating(true);
    try {
      const response = await base44.functions.invoke('service_updateContractStatus', {
        contract_id: id,
        action
      });

      if (response.data && response.data.success) {
        toast.success('Status atualizado com sucesso!');
        loadContract();
      } else {
        toast.error(response.data?.error || 'Erro ao atualizar status');
      }
    } catch (e) {
      toast.error('Erro ao atualizar status');
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  const handleRatingSubmit = async (rating) => {
    try {
      const response = await base44.functions.invoke('service_rateContract', {
        contract_id: id,
        score: rating.score,
        comment: rating.comment
      });

      if (response.data && response.data.success) {
        toast.success('Avaliação enviada com sucesso!');
        setShowRating(false);
        loadContract();
      } else {
        toast.error(response.data?.error || 'Erro ao enviar avaliação');
      }
    } catch (e) {
      toast.error('Erro ao enviar avaliação');
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-96 w-full bg-[#19E0FF]/10 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!contract || !offer) {
    return (
      <div className="min-h-screen py-20 px-4 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-bold text-white mb-4">Contrato não encontrado</h3>
          <MetalButton onClick={() => navigate('/mercado/servicos/contratos')}>
            Voltar para contratos
          </MetalButton>
        </div>
      </div>
    );
  }

  const isBuyer = user && user.id === contract.buyer_user_id;
  const isProvider = user && user.id === contract.provider_user_id;

  return (
    <RequireAuth>
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <MetalButton
          variant="secondary"
          onClick={() => navigate('/mercado/servicos/contratos')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </MetalButton>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <GlowCard className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">{offer.title}</h1>
                <p className="text-[#A9B2C7]">Contrato #{contract.id.slice(-8)}</p>
              </div>
              <Badge className={statusLabels[contract.status].color}>
                {statusLabels[contract.status].label}
              </Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-lg p-4">
                <div className="text-[#A9B2C7] text-sm mb-1">Cliente</div>
                <div className="text-white font-bold">{isBuyer ? 'Você' : contract.other_user_name}</div>
              </div>
              <div className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-lg p-4">
                <div className="text-[#A9B2C7] text-sm mb-1">Prestador</div>
                <div className="text-white font-bold">{isProvider ? 'Você' : contract.other_user_name}</div>
              </div>
            </div>

            {contract.notes_from_buyer && (
              <div className="mt-6 p-4 bg-[#19E0FF]/10 border border-[#19E0FF]/30 rounded-lg">
                <div className="text-[#19E0FF] text-sm mb-2">Observações do cliente:</div>
                <p className="text-white text-sm">{contract.notes_from_buyer}</p>
              </div>
            )}

            {contract.scheduled_datetime && (
              <div className="mt-4 flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-[#F7CE46]" />
                <span className="text-[#A9B2C7]">Agendado para:</span>
                <span className="text-white font-bold">
                  {new Date(contract.scheduled_datetime).toLocaleString('pt-BR')}
                </span>
              </div>
            )}
          </GlowCard>

          {/* Timeline */}
          <GlowCard className="p-8">
            <h2 className="text-xl font-bold text-white mb-6">Linha do tempo</h2>
            <ServiceContractTimeline currentStatus={contract.status} />
          </GlowCard>

          {/* Actions */}
          <GlowCard className="p-8">
            <h2 className="text-xl font-bold text-white mb-4">Ações disponíveis</h2>
            <div className="space-y-3">
              {isProvider && contract.status === 'PAID' && (
                <GradientButton
                  onClick={() => handleUpdateStatus('MARK_IN_PROGRESS')}
                  loading={updating}
                  className="w-full"
                >
                  Marcar como em andamento
                </GradientButton>
              )}

              {isBuyer && contract.status === 'IN_PROGRESS' && (
                <GradientButton
                  onClick={() => handleUpdateStatus('MARK_COMPLETED')}
                  loading={updating}
                  className="w-full"
                >
                  Confirmar conclusão do serviço
                </GradientButton>
              )}

              {isBuyer && contract.status === 'COMPLETED' && (
                <GradientButton
                  variant="honor"
                  onClick={() => setShowRating(true)}
                  className="w-full"
                >
                  <Star className="w-5 h-5 mr-2" />
                  Avaliar serviço
                </GradientButton>
              )}

              {isBuyer && ['PAID', 'IN_PROGRESS'].includes(contract.status) && (
                <MetalButton
                  variant="danger"
                  onClick={() => handleUpdateStatus('OPEN_DISPUTE')}
                  loading={updating}
                  className="w-full"
                >
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Abrir disputa
                </MetalButton>
              )}
            </div>
          </GlowCard>
        </motion.div>

        {showRating && (
          <RatingModal
            isOpen={showRating}
            onClose={() => setShowRating(false)}
            onSubmit={handleRatingSubmit}
            title="Avaliar serviço"
            subtitle="Como foi a experiência com este prestador?"
          />
        )}
      </div>
    </div>
    </RequireAuth>
  );
}