import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Edit, Pause, Play, Briefcase } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthProvider';
import RequireAuth from '@/components/auth/RequireAuth';
import SectionTitle from '@/components/ui/SectionTitle';
import GradientButton from '@/components/ui/GradientButton';
import MetalButton from '@/components/ui/MetalButton';
import GlowCard from '@/components/ui/GlowCard';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel
} from '@/components/ui/alert-dialog';

const categoryLabels = {
  DUNGEON_CARRY: 'Carregamento de DG',
  LEVEL_RUSH: 'Rush de Level',
  TG_SUPPORT: 'Suporte em TG',
  CRAFTING: 'Crafting',
  QUEST_HELP: 'Ajuda em Quests',
  OTHER: 'Outros'
};

export default function MercadoServicosMinhasOfertas() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'DUNGEON_CARRY',
    dungeon_code: '',
    min_level_required: '',
    price_type: 'BRL',
    price_brl: '',
    price_cash: '',
    estimated_duration_minutes: '',
    max_slots: ''
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (user) {
      loadMyOffers();
    }
  }, [user]);

  const loadMyOffers = async () => {
    try {
      const response = await base44.functions.invoke('service_getMyOffers', {});
      if (response.data && response.data.success) {
        setOffers(response.data.offers || []);
      }
    } catch (e) {
      console.error('Erro ao carregar ofertas:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOffer = async (e) => {
    e.preventDefault();
    
    if (!formData.title || formData.title.length < 5) {
      toast.error('O título deve ter pelo menos 5 caracteres');
      return;
    }

    if (!formData.description || formData.description.length < 20) {
      toast.error('A descrição deve ter pelo menos 20 caracteres');
      return;
    }

    setCreating(true);
    try {
      const response = await base44.functions.invoke('service_createOffer', formData);
      
      if (response.data && response.data.success) {
        toast.success('Serviço criado com sucesso!');
        setShowCreateForm(false);
        setFormData({
          title: '',
          description: '',
          category: 'DUNGEON_CARRY',
          dungeon_code: '',
          min_level_required: '',
          price_type: 'BRL',
          price_brl: '',
          price_cash: '',
          estimated_duration_minutes: '',
          max_slots: ''
        });
        loadMyOffers();
      } else {
        if (response.data?.redirect) {
          toast.error(response.data.error);
          setTimeout(() => navigate(response.data.redirect), 2000);
        } else {
          toast.error(response.data?.error || 'Erro ao criar oferta');
        }
      }
    } catch (e) {
      toast.error('Erro ao criar oferta');
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      ACTIVE: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Ativo' },
      PAUSED: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Pausado' },
      BANNED: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Banido' }
    };
    const variant = variants[status] || variants.ACTIVE;
    return <Badge className={`${variant.bg} ${variant.text}`}>{variant.label}</Badge>;
  };

  return (
    <RequireAuth>
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <SectionTitle 
            title="Minhas Ofertas de Serviços"
            subtitle="Gerencie os serviços que você oferece"
            centered={false}
          />
          <GradientButton onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="w-5 h-5 mr-2" />
            Criar novo serviço
          </GradientButton>
        </div>

        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <GlowCard className="p-6">
              <h2 className="text-2xl font-bold text-white mb-6">Criar Novo Serviço</h2>
              <form onSubmit={handleCreateOffer} className="space-y-4">
                <div>
                  <label className="text-white text-sm mb-2 block">Título do serviço *</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Ex: Carry completo em ICRH com garantia de drop"
                    className="bg-[#05070B] border-[#19E0FF]/20 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-white text-sm mb-2 block">Descrição detalhada *</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Descreva o que está incluído no serviço, requisitos, etc..."
                    className="bg-[#05070B] border-[#19E0FF]/20 text-white"
                    rows={5}
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-white text-sm mb-2 block">Categoria *</label>
                    <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                      <SelectTrigger className="bg-[#05070B] border-[#19E0FF]/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DUNGEON_CARRY">Carregamento de DG</SelectItem>
                        <SelectItem value="LEVEL_RUSH">Rush de Level</SelectItem>
                        <SelectItem value="TG_SUPPORT">Suporte em TG</SelectItem>
                        <SelectItem value="CRAFTING">Crafting</SelectItem>
                        <SelectItem value="QUEST_HELP">Ajuda em Quests</SelectItem>
                        <SelectItem value="OTHER">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-white text-sm mb-2 block">DG / Mapa (opcional)</label>
                    <Input
                      value={formData.dungeon_code}
                      onChange={(e) => setFormData({...formData, dungeon_code: e.target.value})}
                      placeholder="Ex: ICRH, FT2, LAKESIDE"
                      className="bg-[#05070B] border-[#19E0FF]/20 text-white"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-white text-sm mb-2 block">Nível mínimo</label>
                    <Input
                      type="number"
                      value={formData.min_level_required}
                      onChange={(e) => setFormData({...formData, min_level_required: e.target.value})}
                      placeholder="Ex: 170"
                      className="bg-[#05070B] border-[#19E0FF]/20 text-white"
                    />
                  </div>

                  <div>
                    <label className="text-white text-sm mb-2 block">Duração (minutos) *</label>
                    <Input
                      type="number"
                      value={formData.estimated_duration_minutes}
                      onChange={(e) => setFormData({...formData, estimated_duration_minutes: e.target.value})}
                      placeholder="Ex: 45"
                      className="bg-[#05070B] border-[#19E0FF]/20 text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-white text-sm mb-2 block">Vagas</label>
                    <Input
                      type="number"
                      value={formData.max_slots}
                      onChange={(e) => setFormData({...formData, max_slots: e.target.value})}
                      placeholder="Ex: 3"
                      className="bg-[#05070B] border-[#19E0FF]/20 text-white"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-white text-sm mb-2 block">Tipo de pagamento *</label>
                    <Select value={formData.price_type} onValueChange={(val) => setFormData({...formData, price_type: val})}>
                      <SelectTrigger className="bg-[#05070B] border-[#19E0FF]/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BRL">Reais (R$)</SelectItem>
                        <SelectItem value="CASH">Cash ZIRON</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.price_type === 'BRL' && (
                    <div>
                      <label className="text-white text-sm mb-2 block">Preço em reais (R$) *</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.price_brl}
                        onChange={(e) => setFormData({...formData, price_brl: e.target.value})}
                        placeholder="Ex: 50.00"
                        className="bg-[#05070B] border-[#19E0FF]/20 text-white"
                        required
                      />
                    </div>
                  )}

                  {formData.price_type === 'CASH' && (
                    <div>
                      <label className="text-white text-sm mb-2 block">Preço em cash *</label>
                      <Input
                        type="number"
                        value={formData.price_cash}
                        onChange={(e) => setFormData({...formData, price_cash: e.target.value})}
                        placeholder="Ex: 3000"
                        className="bg-[#05070B] border-[#19E0FF]/20 text-white"
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <MetalButton
                    type="button"
                    variant="secondary"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancelar
                  </MetalButton>
                  <GradientButton type="submit" loading={creating}>
                    Salvar oferta
                  </GradientButton>
                </div>
              </form>
            </GlowCard>
          </motion.div>
        )}

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 bg-[#19E0FF]/10 rounded-xl" />
            ))}
          </div>
        ) : offers.length > 0 ? (
          <div className="space-y-4">
            {offers.map((offer, index) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlowCard className="p-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-white">{offer.title}</h3>
                        {getStatusBadge(offer.status)}
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge className="bg-[#19E0FF]/20 text-[#19E0FF] text-xs">
                          {categoryLabels[offer.category]}
                        </Badge>
                        <Badge variant="outline" className="text-[#A9B2C7] text-xs">
                          {offer.price_type === 'BRL' 
                            ? `R$ ${offer.price_brl?.toFixed(2)}`
                            : `${offer.price_cash} cash`
                          }
                        </Badge>
                      </div>
                      <p className="text-[#A9B2C7] text-sm line-clamp-2">{offer.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <MetalButton
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate(`/mercado/servicos/oferta/${offer.id}`)}
                      >
                        Ver detalhes
                      </MetalButton>
                    </div>
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Briefcase className="w-16 h-16 text-[#A9B2C7]/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Nenhuma oferta criada ainda</h3>
            <p className="text-[#A9B2C7] mb-6">Crie sua primeira oferta de serviço e comece a ganhar!</p>
            <GradientButton onClick={() => setShowCreateForm(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Criar primeiro serviço
            </GradientButton>
          </div>
        )}
      </div>
    </div>
    </RequireAuth>
  );
}

function getStatusBadge(status) {
  const variants = {
    ACTIVE: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Ativo' },
    PAUSED: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Pausado' },
    BANNED: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Banido' }
  };
  const variant = variants[status] || variants.ACTIVE;
  return <Badge className={`${variant.bg} ${variant.text}`}>{variant.label}</Badge>;
}