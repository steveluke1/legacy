import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, DollarSign, Plus, Loader2, AlertCircle, Users } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAdminAuth } from './AdminAuthProvider';
import GlowCard from '@/components/ui/GlowCard';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import GradientButton from '@/components/ui/GradientButton';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

export default function AdminCash() {
  const { token } = useAdminAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDebounce, setSearchDebounce] = useState('');
  const [page, setPage] = useState(1);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [cashAmount, setCashAmount] = useState('');
  const [operation, setOperation] = useState('ADD');

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: accountsData, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-accounts', searchDebounce, page],
    queryFn: async () => {
      const { adminClient } = await import('./adminClient');
      return await adminClient.apiListAccounts(token, searchDebounce, page, 20);
    },
    enabled: !!token,
    staleTime: 30000,
    retry: 1,
    refetchOnWindowFocus: false
  });

  const setCashMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('admin_setCashForAccount', {
        adminToken: token,
        ...data
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-accounts'] });
      setShowModal(false);
      setSelectedAccount(null);
      setCashAmount('');
      toast.success(`CASH aplicado com sucesso para ${selectedAccount?.username}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Erro ao aplicar CASH');
    }
  });

  const handleApplyCash = () => {
    const amount = parseFloat(cashAmount);
    if (isNaN(amount) || amount < 0) {
      toast.error('Valor inválido');
      return;
    }

    setCashMutation.mutate({
      accountId: selectedAccount.id,
      operation,
      amount
    });
  };

  const openModal = (account) => {
    setSelectedAccount(account);
    setCashAmount('');
    setOperation('ADD');
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Gerenciar CASH</h2>
          {accountsData?.notes?.source === 'entities' && (
            <p className="text-xs text-blue-400 mt-1">
              • Modo compatível: dados carregados diretamente do banco
            </p>
          )}
        </div>
      </div>

      {/* Search */}
      <GlowCard className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A9B2C7]" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por ID, username ou email..."
            className="pl-10 bg-[#05070B] border-[#19E0FF]/20 text-white"
          />
        </div>
      </GlowCard>

      {/* Accounts table */}
      <GlowCard className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 bg-[#19E0FF]/10" />
            ))}
            <p className="text-center text-[#A9B2C7] text-sm mt-4">Carregando contas...</p>
          </div>
        ) : error?.message?.includes('Não autorizado') || error?.message?.includes('401') || error?.message?.includes('403') ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-[#FF4B6A] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Sessão expirada</h3>
            <p className="text-[#A9B2C7] mb-6">Faça login novamente para continuar</p>
            <button
              onClick={() => window.location.href = '/AdminAuth'}
              className="px-6 py-3 bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] text-[#05070B] font-bold rounded-lg hover:shadow-lg transition-all"
            >
              Ir para Login
            </button>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-[#FF4B6A] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Erro ao carregar contas</h3>
            <p className="text-[#A9B2C7] mb-6">{error.message}</p>
            <button
              onClick={() => refetch()}
              className="px-6 py-3 bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] text-[#05070B] font-bold rounded-lg hover:shadow-lg transition-all"
            >
              Tentar Novamente
            </button>
          </div>
        ) : accountsData?.items?.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-[#A9B2C7]/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Nenhuma conta encontrada</h3>
            <p className="text-[#A9B2C7]">
              {searchDebounce ? 'Tente ajustar a busca' : 'Nenhuma conta cadastrada ainda'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#19E0FF]/10">
                    <th className="text-left py-3 px-4 text-[#A9B2C7] text-sm font-medium">ID</th>
                    <th className="text-left py-3 px-4 text-[#A9B2C7] text-sm font-medium">Username</th>
                    <th className="text-left py-3 px-4 text-[#A9B2C7] text-sm font-medium">Email</th>
                    <th className="text-left py-3 px-4 text-[#A9B2C7] text-sm font-medium">CASH atual</th>
                    <th className="text-left py-3 px-4 text-[#A9B2C7] text-sm font-medium">Criado em</th>
                    <th className="text-left py-3 px-4 text-[#A9B2C7] text-sm font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {accountsData?.items?.map((account) => (
                    <tr key={account.id} className="border-b border-[#19E0FF]/5 hover:bg-[#19E0FF]/5">
                      <td className="py-3 px-4 text-[#A9B2C7] text-sm font-mono">{account.id.substring(0, 8)}...</td>
                      <td className="py-3 px-4 text-white">{account.username}</td>
                      <td className="py-3 px-4 text-[#A9B2C7] text-sm">{account.email || '-'}</td>
                      <td className="py-3 px-4 text-[#F7CE46] font-bold">{account.cash_balance?.toLocaleString()}</td>
                      <td className="py-3 px-4 text-[#A9B2C7] text-sm">
                        {new Date(account.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => openModal(account)}
                          className="px-3 py-1.5 bg-[#19E0FF]/20 hover:bg-[#19E0FF]/30 text-[#19E0FF] rounded text-sm transition-colors flex items-center gap-1"
                        >
                          <DollarSign className="w-4 h-4" />
                          Aplicar CASH
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {accountsData && accountsData.total > accountsData.pageSize && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-[#A9B2C7] text-sm">
                  Mostrando {(page - 1) * accountsData.pageSize + 1} - {Math.min(page * accountsData.pageSize, accountsData.total)} de {accountsData.total}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-4 py-2 bg-[#0C121C] border border-[#19E0FF]/20 text-white rounded disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page * accountsData.pageSize >= accountsData.total}
                    className="px-4 py-2 bg-[#0C121C] border border-[#19E0FF]/20 text-white rounded disabled:opacity-50"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </GlowCard>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-[#0C121C] border-[#19E0FF]/20">
          <DialogHeader>
            <DialogTitle className="text-white">Adicionar/Definir CASH</DialogTitle>
          </DialogHeader>
          
          {selectedAccount && (
            <div className="space-y-4">
              <div className="bg-[#05070B] rounded-lg p-4">
                <p className="text-[#A9B2C7] text-sm mb-1">Conta</p>
                <p className="text-white font-bold">{selectedAccount.username}</p>
                <p className="text-[#A9B2C7] text-sm">ID: {selectedAccount.id}</p>
                <p className="text-[#F7CE46] mt-2">CASH atual: {selectedAccount.cash_balance?.toLocaleString()}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#A9B2C7] mb-2">
                  Operação
                </label>
                <Select value={operation} onValueChange={setOperation}>
                  <SelectTrigger className="bg-[#05070B] border-[#19E0FF]/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADD">Adicionar ao saldo</SelectItem>
                    <SelectItem value="SET">Definir saldo exato</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#A9B2C7] mb-2">
                  Valor de CASH
                </label>
                <Input
                  type="number"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder="0"
                  className="bg-[#05070B] border-[#19E0FF]/20 text-white"
                  min="0"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-[#0C121C] border border-[#19E0FF]/20 text-white rounded hover:bg-[#19E0FF]/10"
                  disabled={setCashMutation.isPending}
                >
                  Cancelar
                </button>
                <GradientButton
                  onClick={handleApplyCash}
                  disabled={setCashMutation.isPending || !cashAmount}
                  className="flex-1"
                >
                  {setCashMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Aplicando...
                    </>
                  ) : (
                    'Aplicar'
                  )}
                </GradientButton>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}