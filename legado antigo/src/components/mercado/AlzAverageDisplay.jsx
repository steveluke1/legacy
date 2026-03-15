import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AlzAverageDisplay() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAverage();
    const interval = setInterval(loadAverage, 600000); // 10 minutes
    return () => clearInterval(interval);
  }, []);

  const loadAverage = async () => {
    try {
      const response = await base44.functions.invoke('market_calculateAlzAverage', {});
      if (response.data?.success) {
        setData(response.data);
      }
    } catch (e) {
      console.error('Erro ao calcular média ALZ:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data || data.sample_size === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(247, 206, 70, 0.3)' }}
      className="p-6 bg-gradient-to-br from-[#F7CE46]/20 to-[#FFD700]/10 border-2 border-[#F7CE46]/40 rounded-xl"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-[#F7CE46]/30 flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-6 h-6 text-[#F7CE46]" />
        </div>
        <div className="flex-1">
          <h3 className="text-white font-bold text-lg mb-1">
            Média de preço do ALZ
          </h3>
          <p className="text-[#A9B2C7] text-xs mb-3">
            Últimos 7 dias
          </p>
          <motion.div
            animate={{ 
              textShadow: [
                '0 0 10px rgba(247, 206, 70, 0.5)',
                '0 0 20px rgba(247, 206, 70, 0.8)',
                '0 0 10px rgba(247, 206, 70, 0.5)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-3xl font-black text-[#F7CE46] mb-3"
          >
            R$ {data.average_brl_per_100m?.toFixed(2)}
          </motion.div>
          <p className="text-white text-sm font-bold mb-2">
            a cada 100.000.000 ALZ
          </p>
          <div className="flex items-center gap-2 text-[#A9B2C7] text-xs">
            <BarChart3 className="w-3 h-3" />
            <span>Amostra baseada em {data.sample_size} transações reais</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}