import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, RefreshCw, Package } from 'lucide-react';
import GradientButton from '@/components/ui/GradientButton';
import GlowCard from '@/components/ui/GlowCard';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function StreamerPackagesSection({ userAccount }) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['storeStreamerPackages'],
    queryFn: async () => {
      const response = await base44.functions.invoke('store_listStreamerPackages', {});
      return response.data;
    },
    staleTime: 60000,
    retry: 1,
    refetchOnWindowFocus: false
  });

  if (error) {
    return (
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-6">Pacotes Streamer</h2>
        <div className="text-center py-12 bg-[#0C121C] rounded-xl border border-[#19E0FF]/20">
          <AlertTriangle className="w-12 h-12 text-[#FF4B6A] mx-auto mb-4" />
          <p className="text-white mb-4">Não foi possível carregar os pacotes</p>
          <GradientButton onClick={() => refetch()} variant="secondary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </GradientButton>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-white mb-2">Pacotes Streamer</h2>
        <p className="text-[#A9B2C7] mb-6">Pacotes especiais disponíveis para compra com CASH</p>
        <div className="grid md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-96 bg-[#19E0FF]/10" />
          ))}
        </div>
      </div>
    );
  }

  const packages = data?.packages || [];

  if (packages.length === 0) {
    return null; // Don't show section if no packages
  }

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold text-white mb-2">Pacotes Streamer</h2>
      <p className="text-[#A9B2C7] mb-6">
        Pacotes especiais disponíveis para compra com CASH
      </p>

      <div className="grid md:grid-cols-3 gap-6">
        {packages.map((pkg, index) => (
          <motion.div
            key={pkg.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <GlowCard glowColor="#F7CE46">
              <div className="p-6 h-full flex flex-col">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#F7CE46] to-[#FFD700] flex items-center justify-center">
                    <Package className="w-10 h-10 text-[#05070B]" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{pkg.name}</h3>
                  
                  <div className="space-y-3 mb-4">
                    {pkg.items.slice(0, 5).map((item, idx) => (
                      <div 
                        key={idx}
                        className="flex items-center justify-between px-4 py-2 bg-[#0C121C] rounded-lg border border-[#19E0FF]/20"
                      >
                        <span className="text-[#A9B2C7] text-sm">{item.label}</span>
                        {item.quantity && item.quantity > 1 && (
                          <Badge className="bg-[#19E0FF]/20 text-[#19E0FF] border-0">
                            {item.quantity}x
                          </Badge>
                        )}
                      </div>
                    ))}
                    {pkg.items.length > 5 && (
                      <p className="text-[#A9B2C7] text-xs">
                        + {pkg.items.length - 5} itens adicionais
                      </p>
                    )}
                  </div>

                  <div className="px-4 py-4 bg-gradient-to-r from-[#F7CE46]/20 to-[#FFD700]/10 rounded-lg border border-[#F7CE46]/30">
                    <div className="text-center">
                      <span className="text-[#A9B2C7] text-sm block mb-1">Preço:</span>
                      <span className="text-[#F7CE46] font-bold text-2xl">
                        {pkg.price_cash.toLocaleString('pt-BR')} ⬥ CASH
                      </span>
                    </div>
                  </div>
                </div>

                <GradientButton
                  variant="honor"
                  onClick={() => toast.info('Em breve você poderá comprar este pacote diretamente pela loja.')}
                  className="w-full mt-auto"
                >
                  Em breve
                </GradientButton>
              </div>
            </GlowCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}