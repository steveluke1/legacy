import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Box, X, Gift } from 'lucide-react';
import { toast } from 'sonner';
import MetalButton from '@/components/ui/MetalButton';
import { useNavigate } from 'react-router-dom';

const TIER_CONFIG = {
  common: {
    label: 'Comum',
    bgGradient: 'from-[#6B7280] to-[#9CA3AF]',
    textColor: 'text-[#9CA3AF]',
    glowColor: '#9CA3AF'
  },
  rare: {
    label: 'Raro',
    bgGradient: 'from-[#2563EB] to-[#60A5FA]',
    textColor: 'text-[#60A5FA]',
    glowColor: '#60A5FA'
  },
  epic: {
    label: 'Épico',
    bgGradient: 'from-[#7C3AED] to-[#A855F7]',
    textColor: 'text-[#A855F7]',
    glowColor: '#A855F7'
  },
  legendary: {
    label: 'Lendário',
    bgGradient: 'from-[#CA8A04] to-[#FACC15]',
    textColor: 'text-[#FACC15]',
    glowColor: '#FACC15'
  }
};

export default function MultiExtensorBoxOpeningModal({ quantity, onClose }) {
  const navigate = useNavigate();
  const [stage, setStage] = useState('opening');
  const [results, setResults] = useState([]);
  const [tierStats, setTierStats] = useState({});
  const [isOpening, setIsOpening] = useState(false);

  const openMutation = useMutation({
    mutationFn: async () => {
      if (isOpening) {
        throw new Error('Já está abrindo...');
      }
      setIsOpening(true);
      const res = await base44.functions.invoke('mystery_openMultipleBoxes', { quantity });
      if (!res.data || !res.data.success) {
        throw new Error(res.data?.error || 'Erro ao abrir caixas');
      }
      return res.data;
    },
    onSuccess: (data) => {
      setResults(data.rewards || []);
      
      const stats = {};
      (data.rewards || []).forEach(reward => {
        stats[reward.rarity] = (stats[reward.rarity] || 0) + 1;
      });
      setTierStats(stats);
      
      setTimeout(() => setStage('results'), 800);
    },
    onError: (error) => {
      console.error('Error opening multiple boxes:', error);
      toast.error(error.response?.data?.error || error.message || 'Erro ao abrir caixas');
      setIsOpening(false);
      onClose();
    },
    retry: 0
  });

  useEffect(() => {
    if (!isOpening) {
      openMutation.mutate();
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ backgroundColor: 'rgba(5, 7, 11, 0.95)' }}
    >
      <div className="relative w-full max-w-6xl my-8">
        {stage === 'results' && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 text-white hover:text-[#A855F7] transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
        )}

        {/* Opening Animation */}
        {stage === 'opening' && (
          <motion.div className="flex flex-col items-center">
            <div className="grid grid-cols-5 gap-4 mb-8">
              {[...Array(Math.min(10, quantity))].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    rotate: [0, -5, 5, -5, 5, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ duration: 0.3, repeat: Infinity, delay: i * 0.05 }}
                  className="w-20 h-20 bg-gradient-to-br from-[#A855F7] to-[#9333EA] rounded-2xl flex items-center justify-center"
                >
                  <Box className="w-10 h-10 text-white" />
                </motion.div>
              ))}
            </div>
            <motion.p
              className="text-white text-2xl font-bold"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            >
              Abrindo {quantity} caixas...
            </motion.p>
          </motion.div>
        )}

        {/* Results */}
        {stage === 'results' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0C121C] border border-[#A855F7]/30 rounded-2xl p-8"
          >
            <h2 className="text-3xl font-black text-white text-center mb-2">
              Caixas Abertas!
            </h2>
            <p className="text-[#A9B2C7] text-center mb-8">
              Você abriu {results.length} caixas e obteve:
            </p>

            {/* Tier Stats */}
            <div className="grid grid-cols-5 gap-4 mb-8">
              {Object.entries(TIER_CONFIG).map(([tier, config]) => {
                const count = tierStats[tier] || 0;
                if (count === 0) return null;
                
                return (
                  <div
                    key={tier}
                    className={`bg-gradient-to-br ${config.bgGradient} rounded-xl p-4 text-center`}
                  >
                    <div className="text-3xl font-black text-white mb-1">{count}</div>
                    <div className="text-sm font-bold text-white/90">{config.label}</div>
                  </div>
                );
              })}
            </div>

            {/* Rewards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-96 overflow-y-auto mb-8 p-2">
              <AnimatePresence>
                {results.map((reward, index) => {
                  const config = TIER_CONFIG[reward.rarity];
                  return (
                    <motion.div
                      key={`${reward.templateSlug}-${index}`}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className={`bg-gradient-to-br ${config.bgGradient} rounded-xl p-4 text-center`}
                    >
                      <Gift className="w-12 h-12 mx-auto mb-2 text-white" />
                      <div className="text-xs font-bold text-white truncate">
                        {reward.name}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <MetalButton
                onClick={() => navigate('/minha-conta/extensores')}
                className="flex-1"
                variant="primary"
              >
                Ver Minhas Recompensas
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