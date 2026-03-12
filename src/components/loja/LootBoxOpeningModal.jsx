import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Package, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import MetalButton from '@/components/ui/MetalButton';
import BadgeIcon from '@/components/ui/BadgeIcon';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const RARITY_CONFIG = {
  RARA: {
    label: 'Insígna (Rara)',
    bgGradient: 'from-[#15803D] to-[#22C55E]',
    glowColor: '#22C55E',
    particleColor: '#4ADE80'
  },
  UNICA: {
    label: 'Insígna (Unica)',
    bgGradient: 'from-[#1E40AF] to-[#3B82F6]',
    glowColor: '#3B82F6',
    particleColor: '#60A5FA'
  },
  EPICO: {
    label: 'Insígna (Epico)',
    bgGradient: 'from-[#7C3AED] to-[#A855F7]',
    glowColor: '#A855F7',
    particleColor: '#C084FC'
  },
  MESTRE: {
    label: 'Insígna (Mestre)',
    bgGradient: 'from-[#B91C1C] to-[#EF4444]',
    glowColor: '#EF4444',
    particleColor: '#F87171'
  },
  LENDARIA: {
    label: 'Insígna (Lendaria)',
    bgGradient: 'from-[#CA8A04] to-[#FACC15]',
    glowColor: '#FACC15',
    particleColor: '#FDE047'
  },
  // Legacy support for old rarities
  common: {
    label: 'Insígnia Comum (Legacy)',
    bgGradient: 'from-[#15803D] to-[#22C55E]',
    glowColor: '#22C55E',
    particleColor: '#4ADE80'
  },
  rare: {
    label: 'Insígnia Rara (Legacy)',
    bgGradient: 'from-[#1E40AF] to-[#3B82F6]',
    glowColor: '#3B82F6',
    particleColor: '#60A5FA'
  },
  epic: {
    label: 'Insígnia Épica (Legacy)',
    bgGradient: 'from-[#7C3AED] to-[#A855F7]',
    glowColor: '#A855F7',
    particleColor: '#C084FC'
  },
  legendary: {
    label: 'Insígnia Lendária (Legacy)',
    bgGradient: 'from-[#CA8A04] to-[#FACC15]',
    glowColor: '#FACC15',
    particleColor: '#FDE047'
  }
};

export default function LootBoxOpeningModal({ boxId, onClose }) {
  const navigate = useNavigate();
  const [stage, setStage] = useState('idle'); // idle -> opening -> revealing -> result
  const [badgeData, setBadgeData] = useState(null);

  const openMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('badge_openLootBox', { userLootBoxId: boxId });
      if (!res.data || !res.data.success) {
        throw new Error(res.data?.error || 'Erro ao abrir caixa');
      }
      return res.data;
    },
    onSuccess: (data) => {
      setBadgeData(data);
      setTimeout(() => setStage('revealing'), 800);
    },
    onError: (error) => {
      console.error('Error opening badge box:', error);
      toast.error(error.response?.data?.error || error.message || 'Erro ao abrir caixa');
      onClose();
    },
    retry: 0
  });

  useEffect(() => {
    if (stage === 'idle') {
      setStage('opening');
      openMutation.mutate();
    }
  }, []);

  useEffect(() => {
    if (stage === 'revealing') {
      setTimeout(() => setStage('result'), 700);
    }
  }, [stage]);

  const handleEquip = useCallback(async () => {
    try {
      await base44.functions.invoke('badge_equipBadge', { userBadgeId: badgeData.badge.id });
      toast.success('Insígnia equipada com sucesso!');
      onClose();
    } catch (error) {
      toast.error('Erro ao equipar insígnia');
    }
  }, [badgeData, onClose]);

  const handleViewCollection = useCallback(() => {
    navigate(createPageUrl('MinhaContaInsignias'));
    onClose();
  }, [navigate, onClose]);

  const rarityConfig = badgeData ? (RARITY_CONFIG[badgeData.rarity] || RARITY_CONFIG.RARA) : RARITY_CONFIG.RARA;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(5, 7, 11, 0.95)' }}
    >
      <div className="relative w-full max-w-2xl">
        {/* Close Button */}
        {stage === 'result' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 text-white hover:text-[#19E0FF] transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
        )}

        {/* Opening Stage */}
        {stage === 'opening' && (
          <motion.div
            className="flex flex-col items-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <motion.div
              animate={{
                rotate: [0, -5, 5, -5, 5, 0],
                scale: [1, 1.05, 1, 1.05, 1]
              }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="w-48 h-48 bg-gradient-to-br from-[#19E0FF] to-[#1A9FE8] rounded-3xl flex items-center justify-center shadow-2xl"
            >
              <Package className="w-24 h-24 text-white" />
            </motion.div>
            <motion.p
              className="text-white text-2xl font-bold mt-8"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              Abrindo caixa...
            </motion.p>
          </motion.div>
        )}

        {/* Revealing Stage */}
        {stage === 'revealing' && badgeData && (
          <motion.div
            className="flex flex-col items-center"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <motion.div
              animate={{
                boxShadow: [
                  `0 0 20px ${rarityConfig.glowColor}`,
                  `0 0 60px ${rarityConfig.glowColor}`,
                  `0 0 20px ${rarityConfig.glowColor}`
                ]
              }}
              transition={{ duration: 1, repeat: Infinity }}
              className={`w-64 h-64 bg-gradient-to-br ${rarityConfig.bgGradient} rounded-3xl flex items-center justify-center relative overflow-hidden`}
            >
              {/* Particle effects */}
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{ backgroundColor: rarityConfig.particleColor }}
                  initial={{
                    x: 0,
                    y: 0,
                    opacity: 1
                  }}
                  animate={{
                    x: (Math.random() - 0.5) * 300,
                    y: (Math.random() - 0.5) * 300,
                    opacity: 0
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.1
                  }}
                />
              ))}
              
              <div className="w-32 h-32 flex items-center justify-center">
                <BadgeIcon rarity={badgeData.rarity} size="xl" />
              </div>
            </motion.div>
            <motion.p
              className="text-white text-3xl font-black mt-8"
              style={{ color: rarityConfig.glowColor }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              {rarityConfig.label}
            </motion.p>
          </motion.div>
        )}

        {/* Result Stage */}
        {stage === 'result' && badgeData && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0C121C] border-2 rounded-2xl p-8"
            style={{ borderColor: badgeData.badge.colorHex }}
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-white mb-2">
                Você recebeu uma nova insígnia!
              </h2>
              <div
                className="inline-block px-4 py-2 rounded-lg font-bold text-lg"
                style={{
                  backgroundColor: `${badgeData.badge.colorHex}20`,
                  color: badgeData.badge.colorHex,
                  border: `2px solid ${badgeData.badge.colorHex}`
                }}
              >
                {rarityConfig.label}
              </div>
            </div>

            <div className="flex flex-col items-center mb-8">
              <div
                className="w-32 h-32 rounded-2xl flex items-center justify-center mb-4"
                style={{
                  background: `linear-gradient(135deg, ${badgeData.badge.colorHex}40, ${badgeData.badge.colorHex}20)`,
                  border: `3px solid ${badgeData.badge.colorHex}`
                }}
              >
                <BadgeIcon rarity={badgeData.rarity} size="xl" />
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">
                {badgeData.badge.name}
              </h3>
              <p className="text-[#A9B2C7] text-center max-w-md">
                {badgeData.badge.description}
              </p>
            </div>

            <div className="flex gap-4">
              <MetalButton
                onClick={handleEquip}
                className="flex-1"
                variant="primary"
              >
                Equipar agora
              </MetalButton>
              <MetalButton
                onClick={handleViewCollection}
                className="flex-1"
                variant="secondary"
              >
                Ver coleção
              </MetalButton>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}