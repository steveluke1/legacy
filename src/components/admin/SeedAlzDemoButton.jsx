import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import MetalButton from '@/components/ui/MetalButton';
import { Database, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SeedAlzDemoButton() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  const handleSeed = async () => {
    if (!confirm('Isso irá SUBSTITUIR todos os dados existentes do mercado ALZ. Continuar?')) {
      return;
    }

    setLoading(true);
    try {
      const res = await base44.functions.invoke('alz_seedDemoData', {});
      
      if (res.data.success) {
        setStats(res.data.statistics);
        toast.success('Dados demo criados com sucesso!');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao criar dados demo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Database className="w-6 h-6 text-[#19E0FF]" />
        Popular Mercado ALZ (Demo)
      </h3>
      
      <p className="text-[#A9B2C7] mb-4">
        Cria 50 ofertas de venda e 40 negociações históricas para demonstração do mercado agregado de ALZ.
      </p>

      <MetalButton 
        onClick={handleSeed}
        loading={loading}
        variant="primary"
        className="w-full mb-4"
      >
        <Database className="w-5 h-5 mr-2" />
        Criar Dados Demo
      </MetalButton>

      {stats && (
        <div className="bg-[#19E0FF]/10 border border-[#19E0FF]/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-[#19E0FF]" />
            <span className="text-white font-bold">Dados criados com sucesso!</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#A9B2C7]">Ofertas de venda:</span>
              <span className="text-white font-bold">{stats.sellOrders}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A9B2C7]">Negociações históricas:</span>
              <span className="text-white font-bold">{stats.trades}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A9B2C7]">ALZ disponível total:</span>
              <span className="text-[#19E0FF] font-bold">
                {(stats.totalAlzAvailable / 1_000_000_000).toFixed(2)}B
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A9B2C7]">Preço médio (1B):</span>
              <span className="text-[#F7CE46] font-bold">R$ {stats.avgPricePerBillionBRL}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A9B2C7]">Preço mín/máx:</span>
              <span className="text-white font-bold">
                R$ {stats.minPricePerBillionBRL} / R$ {stats.maxPricePerBillionBRL}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}