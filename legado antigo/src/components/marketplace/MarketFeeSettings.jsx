import React, { useState } from 'react';
import { Percent, Save, AlertCircle, TrendingDown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import GradientButton from '@/components/ui/GradientButton';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import GlowCard from '@/components/ui/GlowCard';

export default function MarketFeeSettings({ adminToken }) {
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [newFee, setNewFee] = useState('');

  const { data: settings, isLoading } = useQuery({
    queryKey: ['market-settings'],
    queryFn: async () => {
      // Try to get global settings
      const result = await base44.entities.MarketSettings.filter({ id: 'global' });
      if (result.length > 0) {
        return result[0];
      }
      // If not found, create default
      return await base44.entities.MarketSettings.create({
        id: 'global',
        market_fee_percent: 1.5,
        efi_environment: 'homolog',
        efi_split_enabled: true
      });
    },
    staleTime: 30000
  });

  const updateFeeMutation = useMutation({
    mutationFn: async (newFeePercent) => {
      const oldFee = settings.market_fee_percent;
      
      // Update settings
      await base44.entities.MarketSettings.update(settings.id, {
        market_fee_percent: newFeePercent,
        updated_at: new Date().toISOString(),
        updated_by_admin_id: adminToken // Use admin token as identifier
      });

      // Create ledger entry
      try {
        await base44.entities.LedgerEntry.create({
          entry_id: `fee_${Date.now()}`,
          type: 'FEE_CHANGED',
          ref_id: 'global',
          actor: 'admin',
          actor_id: adminToken,
          metadata: {
            old_fee_percent: oldFee,
            new_fee_percent: newFeePercent,
            changed_at: new Date().toISOString()
          },
          created_at: new Date().toISOString()
        });
      } catch (error) {
        console.error('Failed to create ledger entry:', error);
      }

      return newFeePercent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-settings'] });
      toast.success('Taxa de mercado atualizada com sucesso');
      setEditMode(false);
      setNewFee('');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar taxa: ' + error.message);
    }
  });

  const handleSave = () => {
    const feeValue = parseFloat(newFee);
    if (isNaN(feeValue) || feeValue < 0 || feeValue > 20) {
      toast.error('Taxa deve estar entre 0% e 20%');
      return;
    }
    updateFeeMutation.mutate(feeValue);
  };

  const startEdit = () => {
    setNewFee(settings?.market_fee_percent?.toString() || '1.5');
    setEditMode(true);
  };

  if (isLoading) {
    return (
      <GlowCard className="p-6">
        <Skeleton className="h-8 w-48 mb-4 bg-[#19E0FF]/10" />
        <Skeleton className="h-12 w-full bg-[#19E0FF]/10" />
      </GlowCard>
    );
  }

  return (
    <GlowCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#F7CE46]/20 rounded-lg flex items-center justify-center">
            <Percent className="w-6 h-6 text-[#F7CE46]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Taxa de Mercado</h3>
            <p className="text-sm text-[#A9B2C7]">Percentual cobrado por transação</p>
          </div>
        </div>
      </div>

      {!editMode ? (
        <div className="space-y-4">
          <div className="bg-[#05070B] rounded-lg p-4">
            <p className="text-[#A9B2C7] text-sm mb-1">Taxa Atual</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-[#19E0FF]">
                {settings?.market_fee_percent || 1.5}%
              </span>
              <span className="text-[#A9B2C7] text-sm">
                (R$ {(settings?.market_fee_percent || 1.5).toFixed(2)} a cada R$ 100)
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-[#19E0FF]/5 border border-[#19E0FF]/20 rounded-lg">
            <TrendingDown className="w-5 h-5 text-[#19E0FF] flex-shrink-0 mt-0.5" />
            <p className="text-sm text-[#A9B2C7]">
              <strong className="text-white">Nota:</strong> O comprador paga o valor cheio. 
              O vendedor recebe o valor líquido após dedução da taxa.
            </p>
          </div>

          <button
            onClick={startEdit}
            className="w-full px-4 py-2 bg-[#19E0FF]/10 hover:bg-[#19E0FF]/20 border border-[#19E0FF]/30 text-[#19E0FF] rounded-lg transition-colors"
          >
            Alterar Taxa
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#A9B2C7] mb-2">
              Nova Taxa (%)
            </label>
            <Input
              type="number"
              min="0"
              max="20"
              step="0.1"
              value={newFee}
              onChange={(e) => setNewFee(e.target.value)}
              placeholder="Ex: 1.5"
              className="bg-[#05070B] border-[#19E0FF]/20 text-white"
            />
            <p className="text-xs text-[#A9B2C7] mt-1">
              Mínimo: 0% | Máximo: 20%
            </p>
          </div>

          <div className="flex items-start gap-2 p-3 bg-[#F7CE46]/10 border border-[#F7CE46]/30 rounded-lg">
            <AlertCircle className="w-4 h-4 text-[#F7CE46] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-[#A9B2C7]">
              Esta alteração será registrada no ledger e aplicada a todas as novas transações.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setEditMode(false);
                setNewFee('');
              }}
              disabled={updateFeeMutation.isPending}
              className="flex-1 px-4 py-2 bg-[#0C121C] border border-[#19E0FF]/20 text-white rounded-lg hover:bg-[#19E0FF]/10 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <GradientButton
              onClick={handleSave}
              disabled={updateFeeMutation.isPending || !newFee}
              loading={updateFeeMutation.isPending}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </GradientButton>
          </div>
        </div>
      )}

      {settings?.updated_at && (
        <p className="text-xs text-[#A9B2C7] mt-4 text-center">
          Última atualização: {new Date(settings.updated_at).toLocaleString('pt-BR')}
        </p>
      )}
    </GlowCard>
  );
}