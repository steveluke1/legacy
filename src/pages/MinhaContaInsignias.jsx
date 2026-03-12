import React, { useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Sparkles, Loader2, Award, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import GlowCard from '@/components/ui/GlowCard';
import MetalButton from '@/components/ui/MetalButton';
import BadgeIcon from '@/components/ui/BadgeIcon';
import RequireAuth from '@/components/auth/RequireAuth';
import LoadingShell from '@/components/ui/LoadingShell';

const RARITY_ORDER = ['RARA', 'UNICA', 'EPICO', 'MESTRE', 'LENDARIA'];
const RARITY_LABELS = {
  RARA: 'Insígna (Rara)',
  UNICA: 'Insígna (Unica)',
  EPICO: 'Insígna (Epico)',
  MESTRE: 'Insígna (Mestre)',
  LENDARIA: 'Insígna (Lendaria)',
  // Legacy support for old rarities
  common: 'Insígna (Comum - Legacy)',
  rare: 'Insígna (Rara - Legacy)',
  epic: 'Insígna (Épico - Legacy)',
  legendary: 'Insígna (Lendária - Legacy)'
};

export default function MinhaContaInsignias() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['user-badges'],
    queryFn: async () => {
      const res = await base44.functions.invoke('badge_getUserBadges', {});
      if (!res.data || !res.data.success) {
        throw new Error(res.data?.error || 'Erro ao carregar insígnias');
      }
      return res.data;
    },
    staleTime: 30000,
    refetchOnWindowFocus: false,
    retry: 2
  });

  const equipMutation = useMutation({
    mutationFn: async (userBadgeId) => {
      const res = await base44.functions.invoke('badge_equipBadge', { userBadgeId });
      if (!res.data || !res.data.success) {
        throw new Error(res.data?.error || 'Erro ao equipar insígnia');
      }
      return res.data;
    },
    onSuccess: () => {
      toast.success('Insígnia equipada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['user-badges'] });
    },
    onError: (error) => {
      console.error('Error equipping badge:', error);
      toast.error(error.response?.data?.error || error.message || 'Erro ao equipar insígnia');
    },
    retry: 0
  });

  const badgesByRarity = useMemo(() => {
    if (!data?.badges) return {};
    
    // Group by templateSlug first to count duplicates
    const groupedByTemplate = {};
    data.badges.forEach(badge => {
      const key = badge.templateSlug || `${badge.name}_${badge.rarity}`;
      if (!groupedByTemplate[key]) {
        groupedByTemplate[key] = {
          badge: badge,
          quantity: 0,
          userBadgeIds: [],
          latestObtainedAt: badge.obtainedAt
        };
      }
      groupedByTemplate[key].quantity++;
      groupedByTemplate[key].userBadgeIds.push(badge.userBadgeId);
      // Keep the most recent obtainedAt
      if (badge.obtainedAt > groupedByTemplate[key].latestObtainedAt) {
        groupedByTemplate[key].latestObtainedAt = badge.obtainedAt;
      }
      // Keep equipped status if any instance is equipped
      if (badge.isEquipped) {
        groupedByTemplate[key].badge = badge;
      }
    });
    
    // Convert to array and group by rarity
    const grouped = {};
    RARITY_ORDER.forEach(rarity => {
      grouped[rarity] = Object.values(groupedByTemplate)
        .filter(g => g.badge.rarity === rarity)
        .sort((a, b) => a.badge.name.localeCompare(b.badge.name));
    });
    return grouped;
  }, [data]);

  const handleEquip = useCallback((badgeId) => {
    equipMutation.mutate(badgeId);
  }, [equipMutation]);

  if (isLoading) {
    return (
      <RequireAuth>
        <LoadingShell message="Carregando insígnias..." fullScreen={false} />
      </RequireAuth>
    );
  }

  const totalBadges = data?.badges?.length || 0;
  const uniqueBadges = useMemo(() => {
    if (!data?.badges) return 0;
    const uniqueTemplates = new Set(data.badges.map(b => b.templateSlug || `${b.name}_${b.rarity}`));
    return uniqueTemplates.size;
  }, [data]);
  const equippedBadge = data?.badges?.find(b => b.isEquipped);

  return (
    <RequireAuth>
    <div className="min-h-screen bg-[#05070B] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Award className="w-10 h-10 text-[#F7CE46]" />
            <h1 className="text-4xl font-black text-white">Minhas Insígnias</h1>
          </div>
          <p className="text-[#A9B2C7]">
            Veja todas as insígnias que você já desbloqueou e equipe sua favorita.
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <GlowCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#19E0FF] to-[#1A9FE8] rounded-xl flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="text-[#A9B2C7] text-sm">Total de Insígnias</div>
                <div className="text-3xl font-black text-white">{totalBadges}</div>
              </div>
            </div>
          </GlowCard>

          <GlowCard className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-[#A855F7] to-[#C084FC] rounded-xl flex items-center justify-center">
                <Award className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="text-[#A9B2C7] text-sm">Tipos Únicos</div>
                <div className="text-3xl font-black text-white">{uniqueBadges}</div>
              </div>
            </div>
          </GlowCard>

          {equippedBadge && (
            <GlowCard className="p-6">
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${equippedBadge.colorHex}40, ${equippedBadge.colorHex}20)`,
                    border: `2px solid ${equippedBadge.colorHex}`
                  }}
                >
                  <BadgeIcon rarity={equippedBadge.rarity} size="lg" />
                </div>
                <div className="flex-1">
                  <div className="text-[#A9B2C7] text-sm">Insígnia Equipada</div>
                  <div className="text-xl font-bold text-white">{equippedBadge.name}</div>
                </div>
              </div>
            </GlowCard>
          )}
        </div>

        {/* Badges by Rarity */}
        {RARITY_ORDER.map(rarity => {
          const badgeGroups = badgesByRarity[rarity] || [];
          if (badgeGroups.length === 0) return null;

          return (
            <div key={rarity} className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Sparkles className="w-6 h-6" style={{ color: badgeGroups[0]?.badge.colorHex }} />
                {RARITY_LABELS[rarity]} ({badgeGroups.length})
              </h2>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {badgeGroups.map((group, idx) => {
                  const badge = group.badge;
                  return (
                    <motion.div
                      key={`${badge.templateSlug || badge.name}_${badge.rarity}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <GlowCard 
                        className="p-6 relative"
                        style={{
                          borderColor: badge.isEquipped ? badge.colorHex : undefined
                        }}
                      >
                        {/* Quantity Badge */}
                        {group.quantity > 1 && (
                          <div 
                            className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold"
                            style={{
                              backgroundColor: `${badge.colorHex}40`,
                              color: badge.colorHex,
                              border: `2px solid ${badge.colorHex}`
                            }}
                          >
                            x{group.quantity}
                          </div>
                        )}

                        {badge.isEquipped && (
                          <div 
                            className="absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                            style={{
                              backgroundColor: `${badge.colorHex}30`,
                              color: badge.colorHex,
                              border: `2px solid ${badge.colorHex}`
                            }}
                          >
                            <Check className="w-3 h-3" />
                            Equipada
                          </div>
                        )}

                        <div className="flex items-start gap-4 mb-4">
                          <div
                            className="w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{
                              background: `linear-gradient(135deg, ${badge.colorHex}40, ${badge.colorHex}20)`,
                              border: `2px solid ${badge.colorHex}`
                            }}
                          >
                            <BadgeIcon rarity={badge.rarity} size="lg" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white font-bold text-lg mb-1">{badge.name}</h3>
                            <div
                              className="inline-block px-2 py-1 rounded text-xs font-bold"
                              style={{
                                backgroundColor: `${badge.colorHex}20`,
                                color: badge.colorHex
                              }}
                            >
                              {RARITY_LABELS[badge.rarity]}
                            </div>
                          </div>
                        </div>

                        <p className="text-[#A9B2C7] text-sm mb-4">{badge.description}</p>

                        <div className="text-xs text-[#A9B2C7] mb-4">
                          Obtida em: {new Date(group.latestObtainedAt).toLocaleDateString('pt-BR')}
                        </div>

                        {!badge.isEquipped && (
                          <MetalButton
                            onClick={() => handleEquip(badge.userBadgeId)}
                            loading={equipMutation.isPending}
                            className="w-full"
                            size="sm"
                          >
                            Equipar
                          </MetalButton>
                        )}
                      </GlowCard>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {totalBadges === 0 && (
          <GlowCard className="p-12 text-center">
            <Award className="w-20 h-20 text-[#A9B2C7] mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Nenhuma insígnia ainda</h3>
            <p className="text-[#A9B2C7] mb-6">
              Compre caixas de insígnias na Loja e comece sua coleção!
            </p>
            <MetalButton onClick={() => window.location.href = '/loja'}>
              Ir para a Loja
            </MetalButton>
          </GlowCard>
        )}
      </div>
    </div>
    </RequireAuth>
  );
}