import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Package, Sparkles, X, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import MetalButton from '@/components/ui/MetalButton';
import BadgeIcon from '@/components/ui/BadgeIcon';
import { useNavigate } from 'react-router-dom';

const RARITY_CONFIG = {
  common: {
    label: 'Comum',
    bgGradient: 'from-[#6B7280] to-[#9CA3AF]',
    glowColor: '#9CA3AF',
    textColor: 'text-[#9CA3AF]'
  },
  rare: {
    label: 'Rara',
    bgGradient: 'from-[#1E40AF] to-[#3B82F6]',
    glowColor: '#3B82F6',
    textColor: 'text-[#3B82F6]'
  },
  epic: {
    label: 'Épica',
    bgGradient: 'from-[#B91C1C] to-[#EF4444]',
    glowColor: '#EF4444',
    textColor: 'text-[#EF4444]'
  },
  legendary: {
    label: 'Lendária',
    bgGradient: 'from-[#CA8A04] to-[#FACC15]',
    glowColor: '#FACC15',
    textColor: 'text-[#FACC15]'
  }
};

export default function MultiLootBoxOpeningModal({ quantity, onClose }) {
  const navigate = useNavigate();
  const [stage, setStage] = useState('idle'); // idle -> opening -> results
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState({ common: 0, rare: 0, epic: 0, legendary: 0 });

  const openMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('badge_openMultipleLootBoxes', { quantity });
      if (!res.data || !res.data.success) {
        throw new Error(res.data?.error || 'Erro ao abrir caixas');
      }
      return res.data;
    },
    onSuccess: (data) => {
      setResults(data.results || []);
      
      // Calculate stats
      const newStats = { common: 0, rare: 0, epic: 0, legendary: 0 };
      data.results?.forEach(result => {
        newStats[result.rarity]++;
      });
      setStats(newStats);
      
      setTimeout(() => setStage('results'), 800);
    },
    onError: (error) => {
      console.error('Error opening multiple badge boxes:', error);
      toast.error(error.response?.data?.error || error.message || 'Erro ao abrir caixas');
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

  const handleViewCollection = useCallback(() => {
    navigate('/minha-conta/insignias');
    onClose();
  }, [navigate, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(5, 7, 11, 0.95)' }}
    >
      <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        {stage === 'results' && (
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
            <div className={`grid gap-3 mb-8 ${quantity <= 10 ? 'grid-cols-5' : quantity <= 50 ? 'grid-cols-10' : 'grid-cols-10'}`}>
              {[...Array(Math.min(quantity, quantity <= 50 ? quantity : 20))].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    rotate: [0, -5, 5, -5, 5, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    duration: 0.4, 
                    repeat: Infinity,
                    delay: i * 0.02 
                  }}
                  className={`bg-gradient-to-br from-[#19E0FF] to-[#1A9FE8] rounded-xl flex items-center justify-center shadow-2xl ${
                    quantity <= 10 ? 'w-20 h-20' : 'w-12 h-12'
                  }`}
                >
                  <Package className={`text-white ${quantity <= 10 ? 'w-10 h-10' : 'w-6 h-6'}`} />
                </motion.div>
              ))}
            </div>
            <motion.p
              className="text-white text-3xl font-bold"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            >
              Abrindo {quantity} caixas...
            </motion.p>
          </motion.div>
        )}

        {/* Results Stage */}
        {stage === 'results' && results.length > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#0C121C] border-2 border-[#19E0FF] rounded-2xl p-8"
          >
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Trophy className="w-10 h-10 text-[#F7CE46]" />
                <h2 className="text-4xl font-black text-white">
                  {results.length} Insígnias Obtidas!
                </h2>
              </div>
              
              {/* Stats */}
              <div className="flex justify-center gap-6 mb-8">
                {Object.entries(stats).map(([rarity, count]) => {
                  if (count === 0) return null;
                  const config = RARITY_CONFIG[rarity];
                  return (
                    <div key={rarity} className="text-center">
                      <div className={`text-3xl font-black ${config.textColor}`}>
                        {count}
                      </div>
                      <div className="text-sm text-[#A9B2C7]">{config.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8 max-h-[50vh] overflow-y-auto">
              {results.map((result, idx) => {
                const config = RARITY_CONFIG[result.rarity];
                return (
                  <motion.div
                    key={idx}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: idx * 0.01 }}
                    className="bg-[#05070B] rounded-xl p-4 border-2"
                    style={{ borderColor: result.badge.colorHex }}
                  >
                    <div
                      className="w-full aspect-square rounded-lg flex items-center justify-center mb-3"
                      style={{
                        background: `linear-gradient(135deg, ${result.badge.colorHex}40, ${result.badge.colorHex}20)`,
                        border: `2px solid ${result.badge.colorHex}`
                      }}
                    >
                      <BadgeIcon rarity={result.rarity} size="md" />
                    </div>
                    <h3 className="text-white font-bold text-sm text-center mb-1 truncate">
                      {result.badge.name}
                    </h3>
                    <div
                      className="text-xs text-center font-bold px-2 py-1 rounded"
                      style={{
                        backgroundColor: `${result.badge.colorHex}20`,
                        color: result.badge.colorHex
                      }}
                    >
                      {config.label}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="flex gap-4">
              <MetalButton
                onClick={handleViewCollection}
                className="flex-1"
                variant="primary"
              >
                Ver minha coleção
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