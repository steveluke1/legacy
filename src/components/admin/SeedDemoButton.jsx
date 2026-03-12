import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import MetalButton from '@/components/ui/MetalButton';
import { toast } from 'sonner';

export default function SeedDemoButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSeed = async () => {
    if (!confirm('Isso criará ~1.000 registros demo. Continuar?')) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await base44.functions.invoke('game_seedFullDemoWorld', {
        players: 1000,
        guilds: 40,
        services: 200,
        market_listings: 300
      });

      if (response.data?.success) {
        setResult(response.data);
        toast.success('Mundo demo criado com sucesso!');
      } else {
        toast.error(response.data?.error || 'Erro ao criar mundo demo');
      }
    } catch (e) {
      toast.error('Erro ao executar seed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-[#0C121C] border border-[#19E0FF]/20 rounded-xl">
      <div className="flex items-center gap-3 mb-4">
        <Database className="w-6 h-6 text-[#19E0FF]" />
        <h3 className="text-white font-bold text-lg">Seed Mundo Demo</h3>
      </div>
      
      <p className="text-[#A9B2C7] text-sm mb-4">
        Popula todo o portal com dados fictícios: ~1.000 jogadores, 40 guildas, rankings, mercado, serviços e TG.
      </p>

      <MetalButton 
        onClick={handleSeed}
        disabled={loading}
        loading={loading}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Criando mundo demo...
          </>
        ) : (
          <>
            <Database className="w-4 h-4 mr-2" />
            Criar Mundo Demo
          </>
        )}
      </MetalButton>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-[#19E0FF]/10 border border-[#19E0FF]/30 rounded-lg"
        >
          <div className="flex items-start gap-2 mb-3">
            <CheckCircle className="w-5 h-5 text-[#19E0FF] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-white font-bold text-sm mb-2">{result.message}</p>
              <div className="text-[#A9B2C7] text-xs space-y-1">
                <p>• Guildas: {result.summary?.guilds || 0}</p>
                <p>• Jogadores: {result.summary?.players || 0}</p>
                <p>• Rankings: {result.summary?.rankings?.power || 0} Poder, {result.summary?.rankings?.tg || 0} TG</p>
                <p>• Mercado: {result.summary?.market || 0} anúncios</p>
                <p>• Serviços: {result.summary?.services || 0} ofertas</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}