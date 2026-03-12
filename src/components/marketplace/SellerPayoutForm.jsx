import React, { useState } from 'react';
import { DollarSign, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import GradientButton from '@/components/ui/GradientButton';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import GlowCard from '@/components/ui/GlowCard';

export default function SellerPayoutForm() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    full_name: '',
    cpf: '',
    efi_pix_key: ''
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ['seller-payout-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const result = await base44.entities.SellerPayoutProfile.filter({ 
        seller_user_id: user.id 
      });
      return result.length > 0 ? result[0] : null;
    },
    enabled: !!user?.id
  });

  React.useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        cpf: profile.cpf || '',
        efi_pix_key: profile.efi_pix_key || ''
      });
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (profile) {
        return await base44.entities.SellerPayoutProfile.update(profile.id, {
          ...data,
          updated_at: new Date().toISOString()
        });
      } else {
        return await base44.entities.SellerPayoutProfile.create({
          seller_user_id: user.id,
          ...data,
          efi_onboarding_status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-payout-profile'] });
      toast.success('Dados salvos com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao salvar: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.efi_pix_key) {
      toast.error('Preencha nome completo e chave PIX');
      return;
    }

    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <GlowCard className="p-6">
        <Skeleton className="h-8 w-64 mb-4 bg-[#19E0FF]/10" />
        <Skeleton className="h-12 w-full mb-3 bg-[#19E0FF]/10" />
        <Skeleton className="h-12 w-full bg-[#19E0FF]/10" />
      </GlowCard>
    );
  }

  return (
    <GlowCard className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-[#10B981]/20 rounded-lg flex items-center justify-center">
          <DollarSign className="w-6 h-6 text-[#10B981]" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Dados para Recebimento</h3>
          <p className="text-sm text-[#A9B2C7]">Configure sua chave PIX para receber vendas</p>
        </div>
      </div>

      {profile?.efi_onboarding_status === 'verified' && (
        <div className="mb-4 flex items-start gap-3 p-3 bg-[#10B981]/10 border border-[#10B981]/30 rounded-lg">
          <CheckCircle className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#10B981]">Perfil Verificado</p>
            <p className="text-xs text-[#A9B2C7]">
              Seus dados foram verificados e você pode receber pagamentos.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#A9B2C7] mb-2">
            Nome Completo *
          </label>
          <Input
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
            placeholder="Seu nome completo"
            className="bg-[#05070B] border-[#19E0FF]/20 text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#A9B2C7] mb-2">
            CPF (opcional)
          </label>
          <Input
            type="text"
            value={formData.cpf}
            onChange={(e) => setFormData(prev => ({ ...prev, cpf: e.target.value }))}
            placeholder="000.000.000-00"
            className="bg-[#05070B] border-[#19E0FF]/20 text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#A9B2C7] mb-2">
            Chave PIX (EFI) *
          </label>
          <Input
            type="text"
            value={formData.efi_pix_key}
            onChange={(e) => setFormData(prev => ({ ...prev, efi_pix_key: e.target.value }))}
            placeholder="email@exemplo.com ou +5511999999999"
            className="bg-[#05070B] border-[#19E0FF]/20 text-white"
            required
          />
          <p className="text-xs text-[#A9B2C7] mt-1">
            Pode ser email, telefone, CPF ou chave aleatória
          </p>
        </div>

        <div className="flex items-start gap-2 p-3 bg-[#19E0FF]/5 border border-[#19E0FF]/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-[#19E0FF] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#A9B2C7]">
            Esta chave PIX será usada para receber o valor líquido das suas vendas (após dedução da taxa do marketplace).
          </p>
        </div>

        <GradientButton
          type="submit"
          disabled={saveMutation.isPending}
          loading={saveMutation.isPending}
          className="w-full"
        >
          <Save className="w-4 h-4 mr-2" />
          {profile ? 'Atualizar Dados' : 'Salvar Dados'}
        </GradientButton>
      </form>
    </GlowCard>
  );
}