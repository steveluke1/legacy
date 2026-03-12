import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Briefcase } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthProvider';
import SectionTitle from '@/components/ui/SectionTitle';
import GradientButton from '@/components/ui/GradientButton';
import GlowCard from '@/components/ui/GlowCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import SellerBadge from '@/components/mercado/SellerBadge';

const categoryLabels = {
  DUNGEON_CARRY: 'Carregamento de DG',
  LEVEL_RUSH: 'Rush de Level',
  TG_SUPPORT: 'Suporte em TG',
  CRAFTING: 'Crafting',
  QUEST_HELP: 'Ajuda em Quests',
  OTHER: 'Outros'
};

export default function MercadoServicos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: 'all',
    price_type: 'all',
    search: ''
  });

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    try {
      const response = await base44.functions.invoke('service_listOffers', {});
      if (response.data && response.data.success) {
        setOffers(response.data.offers || []);
      }
    } catch (e) {
      console.error('Erro ao carregar ofertas:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredOffers = offers.filter(offer => {
    if (filters.category !== 'all' && offer.category !== filters.category) return false;
    if (filters.price_type !== 'all' && offer.price_type !== filters.price_type) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      if (!offer.title.toLowerCase().includes(search) && 
          !offer.description.toLowerCase().includes(search)) {
        return false;
      }
    }
    return true;
  });

  const handleCreateOffer = () => {
    if (!user) {
      navigate('/login?from_url=' + encodeURIComponent('/mercado/servicos/minhas-ofertas'));
    } else {
      navigate('/mercado/servicos/minhas-ofertas');
    }
  };

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <SectionTitle 
            title="Mercado de Serviços In-Game"
            subtitle="Contrate jogadores experientes para carregar DG, ajudar na TG, fazer rush de level e muito mais"
            centered={false}
          />
          <GradientButton onClick={handleCreateOffer} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            {user ? 'Criar serviço' : 'Entrar para oferecer'}
          </GradientButton>
        </div>

        {/* Filters */}
        <GlowCard className="p-6 mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A9B2C7]" />
              <Input
                placeholder="Buscar serviços..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="pl-10 bg-[#05070B] border-[#19E0FF]/20 text-white"
              />
            </div>

            <Select value={filters.category} onValueChange={(val) => setFilters({...filters, category: val})}>
              <SelectTrigger className="bg-[#05070B] border-[#19E0FF]/20 text-white">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                <SelectItem value="DUNGEON_CARRY">Carregamento de DG</SelectItem>
                <SelectItem value="LEVEL_RUSH">Rush de Level</SelectItem>
                <SelectItem value="TG_SUPPORT">Suporte em TG</SelectItem>
                <SelectItem value="CRAFTING">Crafting</SelectItem>
                <SelectItem value="QUEST_HELP">Ajuda em Quests</SelectItem>
                <SelectItem value="OTHER">Outros</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.price_type} onValueChange={(val) => setFilters({...filters, price_type: val})}>
              <SelectTrigger className="bg-[#05070B] border-[#19E0FF]/20 text-white">
                <SelectValue placeholder="Tipo de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="BRL">Reais (R$)</SelectItem>
                <SelectItem value="CASH">Cash ZIRON</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </GlowCard>

        {/* Offers Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 bg-[#19E0FF]/10 rounded-xl" />
            ))}
          </div>
        ) : filteredOffers.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOffers.map((offer, index) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlowCard 
                  className="p-6 h-full flex flex-col"
                  onClick={() => navigate(`/mercado/servicos/oferta/${offer.id}`)}
                >
                  <Badge className="bg-[#19E0FF]/20 text-[#19E0FF] border-[#19E0FF]/30 mb-3 w-fit">
                    {categoryLabels[offer.category]}
                  </Badge>

                  <h3 className="text-xl font-bold text-white mb-3">{offer.title}</h3>
                  <p className="text-[#A9B2C7] text-sm mb-4 line-clamp-3">{offer.description}</p>

                  {offer.dungeon_code && (
                    <div className="text-[#19E0FF] text-sm mb-2">📍 {offer.dungeon_code}</div>
                  )}

                  <div className="mt-auto pt-4 border-t border-[#19E0FF]/10">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-[#A9B2C7] text-xs">Prestador</div>
                        <div className="text-white font-bold text-sm">{offer.provider_name}</div>
                        {offer.provider_rating && (
                          <div className="text-[#F7CE46] text-xs">
                            ⭐ {offer.provider_rating} ({offer.provider_ratings_count})
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-white">
                          {offer.price_type === 'BRL' 
                            ? `R$ ${offer.price_brl.toFixed(2)}`
                            : `${offer.price_cash} cash`
                          }
                        </div>
                        <div className="text-[#A9B2C7] text-xs">~{offer.estimated_duration_minutes}min</div>
                      </div>
                    </div>
                    <GradientButton size="sm" className="w-full">
                      Ver detalhes
                    </GradientButton>
                  </div>
                </GlowCard>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Briefcase className="w-16 h-16 text-[#A9B2C7]/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Nenhum serviço encontrado</h3>
            <p className="text-[#A9B2C7]">
              {filters.search || filters.category !== 'all' || filters.price_type !== 'all'
                ? 'Tente ajustar os filtros.'
                : 'Seja o primeiro a oferecer serviços no Mercado ZIRON!'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}