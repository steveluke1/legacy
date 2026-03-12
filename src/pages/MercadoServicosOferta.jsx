import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Users, Award, AlertCircle, Star } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthProvider';
import GlowCard from '@/components/ui/GlowCard';
import GradientButton from '@/components/ui/GradientButton';
import MetalButton from '@/components/ui/MetalButton';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import SellerBadge from '@/components/mercado/SellerBadge';

const categoryLabels = {
  DUNGEON_CARRY: 'Carregamento de DG',
  LEVEL_RUSH: 'Rush de Level',
  TG_SUPPORT: 'Suporte em TG',
  CRAFTING: 'Crafting',
  QUEST_HELP: 'Ajuda em Quests',
  OTHER: 'Outros'
};

export default function MercadoServicosOferta() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [offer, setOffer] = useState(null);
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showContractForm, setShowContractForm] = useState(false);
  const [formData, setFormData] = useState({
    scheduled_datetime: '',
    notes_from_buyer: '',
    accepted_terms: false
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadOffer();
  }, [id]);

  const loadOffer = async () => {
    try {
      const response = await base44.functions.invoke('service_getOffer', { offer_id: id });
      if (response.data && response.data.success) {
        setOffer(response.data.offer);
        setProvider(response.data.provider);
      }
    } catch (e) {
      console.error('Erro ao carregar oferta:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContract = async () => {
    if (!formData.accepted_terms) {
      toast.error('Você precisa aceitar os termos para continuar');
      return;
    }

    setCreating(true);
    try {
      const response = await base44.functions.invoke('service_createContract', {
        offer_id: id,
        scheduled_datetime: formData.scheduled_datetime || null,
        notes_from_buyer: formData.notes_from_buyer || null
      });

      if (response.data && response.data.success) {
        if (response.data.payment_type === 'BRL' && response.data.payment_url) {
          toast.success('Contrato criado! Redirecionando para pagamento...');
          setTimeout(() => {
            window.location.href = response.data.payment_url;
          }, 1500);
        } else if (response.data.payment_type === 'CASH') {
          toast.success('Contrato criado! O CASH será deduzido quando o serviço for concluído.');
          navigate('/mercado/servicos/contratos');
        } else {
          toast.success('Contrato criado com sucesso!');
          navigate('/mercado/servicos/contratos');
        }
      } else {
        if (response.data?.redirect) {
          toast.error(response.data.error);
          setTimeout(() => navigate(response.data.redirect), 2000);
        } else {
          toast.error(response.data?.error || 'Erro ao criar contrato');
        }
      }
    } catch (e) {
      toast.error('Erro ao criar contrato');
      console.error(e);
    } finally {
      setCreating(false);
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

  if (!offer) {
    return (
      <div className="min-h-screen py-20 px-4 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-bold text-white mb-4">Serviço não encontrado</h3>
          <MetalButton onClick={() => navigate('/mercado/servicos')}>
            Voltar para serviços
          </MetalButton>
        </div>
      </div>
    );
  }

  const isOwnOffer = user && user.id === offer.provider_user_id;

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <MetalButton
          variant="secondary"
          onClick={() => navigate('/mercado/servicos')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </MetalButton>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <GlowCard className="p-8">
            <Badge className="bg-[#19E0FF]/20 text-[#19E0FF] border-[#19E0FF]/30 mb-4">
              {categoryLabels[offer.category]}
            </Badge>

            <h1 className="text-3xl font-bold text-white mb-4">{offer.title}</h1>

            <div className="flex flex-wrap gap-3 mb-6">
              {offer.min_level_required && (
                <Badge variant="outline" className="text-[#F7CE46] border-[#F7CE46]/30">
                  Nível mínimo: {offer.min_level_required}
                </Badge>
              )}
              {offer.dungeon_code && (
                <Badge variant="outline" className="text-[#19E0FF] border-[#19E0FF]/30">
                  📍 {offer.dungeon_code}
                </Badge>
              )}
              <Badge variant="outline" className="text-[#A9B2C7] border-[#A9B2C7]/30">
                <Clock className="w-3 h-3 mr-1" />
                ~{offer.estimated_duration_minutes} minutos
              </Badge>
              {offer.max_slots && (
                <Badge variant="outline" className="text-[#A9B2C7] border-[#A9B2C7]/30">
                  <Users className="w-3 h-3 mr-1" />
                  {offer.max_slots} vagas
                </Badge>
              )}
            </div>

            <div className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-bold text-white mb-3">Descrição do serviço</h2>
              <p className="text-[#A9B2C7] whitespace-pre-wrap leading-relaxed">{offer.description}</p>
            </div>

            {/* Provider Info */}
            <div className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-lg p-6 mb-6">
              <h2 className="text-lg font-bold text-white mb-4">Prestador</h2>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#19E0FF] to-[#1A9FE8] flex items-center justify-center">
                  <span className="text-[#05070B] font-bold">{provider?.username?.[0]?.toUpperCase()}</span>
                </div>
                <div className="flex-1">
                  <div className="text-white font-bold">{provider?.username}</div>
                  {provider?.rating && (
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="w-4 h-4 text-[#F7CE46] fill-[#F7CE46]" />
                      <span className="text-[#F7CE46]">{provider.rating}</span>
                      <span className="text-[#A9B2C7]">({provider.ratings_count} avaliações)</span>
                    </div>
                  )}
                  {provider?.badges && provider.badges.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {provider.badges.map((badge, idx) => (
                        <SellerBadge key={idx} type={badge} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="bg-gradient-to-r from-[#19E0FF]/10 to-transparent border border-[#19E0FF]/30 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[#A9B2C7] text-sm mb-1">Valor do serviço</div>
                  <div className="text-3xl font-bold">
                    {offer.price_type === 'BRL' 
                      ? <span className="text-white">R$ {offer.price_brl.toFixed(2)}</span>
                      : <span className="text-[#F7CE46]">{offer.price_cash.toLocaleString()} ⬥ CASH</span>
                    }
                  </div>
                </div>
                <Badge className="bg-[#F7CE46]/20 text-[#F7CE46] border-[#F7CE46]/30">
                  {offer.price_type === 'BRL' ? 'Pagamento em reais' : 'Pagamento em cash'}
                </Badge>
              </div>
            </div>

            {/* CTA */}
            {isOwnOffer ? (
              <div className="text-center py-4 text-[#A9B2C7]">
                Você é o prestador deste serviço.
              </div>
            ) : showContractForm ? (
              <div className="space-y-4">
                <div>
                  <label className="text-white text-sm mb-2 block">Quando você quer realizar este serviço? (opcional)</label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduled_datetime}
                    onChange={(e) => setFormData({...formData, scheduled_datetime: e.target.value})}
                    className="bg-[#05070B] border-[#19E0FF]/20 text-white"
                  />
                </div>

                <div>
                  <label className="text-white text-sm mb-2 block">Observações para o prestador (opcional)</label>
                  <Textarea
                    value={formData.notes_from_buyer}
                    onChange={(e) => setFormData({...formData, notes_from_buyer: e.target.value})}
                    placeholder="Ex: Preciso de carry em ICRH para farmar set épico..."
                    className="bg-[#05070B] border-[#19E0FF]/20 text-white"
                    rows={4}
                  />
                </div>

                <div className="flex items-start gap-2 p-4 bg-[#F7CE46]/10 border border-[#F7CE46]/30 rounded-lg">
                  <Checkbox
                    checked={formData.accepted_terms}
                    onCheckedChange={(checked) => setFormData({...formData, accepted_terms: checked})}
                    className="mt-1"
                  />
                  <label className="text-sm text-[#A9B2C7]">
                    Li e concordo com os{' '}
                    <a href="/mercado/termos" target="_blank" className="text-[#19E0FF] underline">
                      Termos do Mercado ZIRON
                    </a>
                  </label>
                </div>

                <div className="flex gap-3">
                  <MetalButton
                    variant="secondary"
                    onClick={() => setShowContractForm(false)}
                    className="flex-1"
                  >
                    Cancelar
                  </MetalButton>
                  <GradientButton
                    onClick={handleCreateContract}
                    loading={creating}
                    className="flex-1"
                  >
                    Confirmar e ir para pagamento
                  </GradientButton>
                </div>
              </div>
            ) : (
              <GradientButton
                size="lg"
                onClick={() => {
                  if (!user) {
                    navigate('/login?from_url=' + encodeURIComponent(window.location.pathname));
                  } else {
                    setShowContractForm(true);
                  }
                }}
                className="w-full"
              >
                {user ? 'Contratar serviço' : 'Entrar para contratar'}
              </GradientButton>
            )}
          </GlowCard>
        </motion.div>
      </div>
    </div>
  );
}