import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Gift, X } from 'lucide-react';
import { toast } from 'sonner';
import MetalButton from '@/components/ui/MetalButton';
import { useNavigate } from 'react-router-dom';

export default function MysteryBoxOpeningModal({ boxId, onClose }) {
  const navigate = useNavigate();
  const [stage, setStage] = useState('idle');
  const [rewardData, setRewardData] = useState(null);
  const [isOpening, setIsOpening] = useState(false);

  const getRarityConfig = (rarity) => {
    const configs = {
      legendary: { label: 'Lendário', bgGradient: 'from-[#CA8A04] to-[#FACC15]', glowColor: '#FACC15' },
      epic: { label: 'Épico', bgGradient: 'from-[#7C3AED] to-[#A855F7]', glowColor: '#A855F7' },
      rare: { label: 'Raro', bgGradient: 'from-[#2563EB] to-[#60A5FA]', glowColor: '#60A5FA' },
      common: { label: 'Comum', bgGradient: 'from-[#6B7280] to-[#9CA3AF]', glowColor: '#9CA3AF' }
    };
    return configs[rarity] || configs.common;
  };

  const openMutation = useMutation({
    mutationFn: async () => {
      if (isOpening) {
        throw new Error('Já está abrindo...');
      }
      setIsOpening(true);
      const res = await base44.functions.invoke('mystery_openBox', { userLootBoxId: boxId });
      if (!res.data || !res.data.success) {
        throw new Error(res.data?.error || 'Erro ao abrir caixa');
      }
      return res.data;
    },
    onSuccess: (data) => {
      setRewardData(data);
      setTimeout(() => setStage('revealing'), 600);
    },
    onError: (error) => {
      console.error('Error opening mystery box:', error);
      toast.error(error.response?.data?.error || error.message || 'Erro ao abrir caixa');
      setIsOpening(false);
      onClose();
    },
    retry: 0
  });

  useEffect(() => {
    if (stage === 'idle' && !isOpening) {
      setStage('opening');
      openMutation.mutate();
    }
  }, []);

  useEffect(() => {
    if (stage === 'revealing') {
      setTimeout(() => setStage('result'), 600);
    }
  }, [stage]);

  const handleViewCollection = useCallback(() => {
    navigate('/minha-conta/extensores');
    onClose();
  }, [navigate, onClose]);

  const rarityConfig = rewardData ? getRarityConfig(rewardData.reward?.rarity || 'common') : getRarityConfig('common');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(5, 7, 11, 0.95)' }}
    >
      <div className="relative w-full max-w-2xl">
        {stage === 'result' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 text-white hover:text-[#A855F7] transition-colors"
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
                scale: [1, 1.05, 1]
              }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="w-48 h-48 bg-gradient-to-br from-[#A855F7] to-[#9333EA] rounded-3xl flex items-center justify-center shadow-2xl"
            >
              <Gift className="w-24 h-24 text-white" />
            </motion.div>
            <motion.p
              className="text-white text-2xl font-bold mt-8"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            >
              Abrindo caixa misteriosa...
            </motion.p>
          </motion.div>
        )}

        {/* Revealing Stage */}
        {stage === 'revealing' && rewardData && (
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
              {[...Array(15)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{ backgroundColor: rarityConfig.glowColor }}
                  initial={{ x: 0, y: 0, opacity: 1 }}
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
              
              <Gift className="w-32 h-32 text-white" />
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
        {stage === 'result' && rewardData && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0C121C] border-2 rounded-2xl p-8"
            style={{ borderColor: rewardData.reward.colorHex }}
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-white mb-2">
                Você recebeu uma nova recompensa!
              </h2>
              <div
                className="inline-block px-4 py-2 rounded-lg font-bold text-lg"
                style={{
                  backgroundColor: `${rewardData.reward.colorHex}20`,
                  color: rewardData.reward.colorHex,
                  border: `2px solid ${rewardData.reward.colorHex}`
                }}
              >
                {rarityConfig.label}
              </div>
            </div>

            <div className="flex flex-col items-center mb-8">
              <div
                className="w-32 h-32 rounded-2xl flex items-center justify-center mb-4"
                style={{
                  background: `linear-gradient(135deg, ${rewardData.reward.colorHex}40, ${rewardData.reward.colorHex}20)`,
                  border: `3px solid ${rewardData.reward.colorHex}`
                }}
              >
                <Gift className="w-16 h-16" style={{ color: rewardData.reward.colorHex }} />
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-2">
                {rewardData.reward.name}
              </h3>
              <p className="text-[#A9B2C7] text-center max-w-md">
                {rewardData.reward.description}
              </p>
            </div>

            <div className="flex gap-4">
              <MetalButton
                onClick={handleViewCollection}
                className="flex-1"
                variant="primary"
              >
                Ver minhas recompensas
              </MetalButton>
              <MetalButton
                onClick={onClose}
                className="flex-1"
                variant="secondary"
              >
                Fechar
              </MetalButton>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}