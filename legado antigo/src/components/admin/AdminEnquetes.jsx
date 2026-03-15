import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Plus, Pencil, Trash2, Search, AlertCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAdminAuth } from './AdminAuthProvider';
import { adminClient } from './adminClient';
import GlowCard from '@/components/ui/GlowCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import EnqueteFormModal from './EnqueteFormModal';
import DeleteEnqueteModal from './DeleteEnqueteModal';

export default function AdminEnquetes() {
  const { token } = useAdminAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingEnquete, setEditingEnquete] = useState(null);
  const [deletingEnquete, setDeletingEnquete] = useState(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-enquetes', search, statusFilter, sort],
    queryFn: async () => {
      return await adminClient.apiListEnquetes(token, search, statusFilter, sort);
    },
    enabled: !!token,
    staleTime: 30000,
    retry: 1,
    refetchOnWindowFocus: false
  });

  const createMutation = useMutation({
    mutationFn: (enqueteData) => adminClient.apiCreateEnquete(token, enqueteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-enquetes'] });
      toast.success('Enquete criada com sucesso');
      setShowFormModal(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao criar enquete');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, patch }) => adminClient.apiUpdateEnquete(token, id, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-enquetes'] });
      toast.success('Enquete atualizada com sucesso');
      setShowFormModal(false);
      setEditingEnquete(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao atualizar enquete');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, hardDelete }) => adminClient.apiDeleteEnquete(token, id, hardDelete),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-enquetes'] });
      toast.success('Enquete removida com sucesso');
      setDeletingEnquete(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao remover enquete');
    }
  });

  const handleCreate = () => {
    setEditingEnquete(null);
    setShowFormModal(true);
  };

  const handleEdit = (enquete) => {
    setEditingEnquete(enquete);
    setShowFormModal(true);
  };

  const handleDelete = (enquete) => {
    setDeletingEnquete(enquete);
  };

  const handleFormSubmit = (formData) => {
    if (editingEnquete) {
      updateMutation.mutate({ id: editingEnquete.id, patch: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleConfirmDelete = (hardDelete) => {
    if (deletingEnquete) {
      deleteMutation.mutate({ id: deletingEnquete.id, hardDelete });
    }
  };

  const statusBadge = (status) => {
    const styles = {
      ACTIVE: 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30',
      DRAFT: 'bg-[#F7CE46]/20 text-[#F7CE46] border-[#F7CE46]/30',
      CLOSED: 'bg-[#FF4B6A]/20 text-[#FF4B6A] border-[#FF4B6A]/30'
    };
    const labels = {
      ACTIVE: 'Ativa',
      DRAFT: 'Rascunho',
      CLOSED: 'Encerrada'
    };
    return <Badge className={styles[status]}>{labels[status]}</Badge>;
  };

  if (error?.message?.includes('Não autorizado') || error?.message?.includes('401') || error?.message?.includes('403')) {
    return (
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
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-16 h-16 text-[#FF4B6A] mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Erro ao carregar enquetes</h3>
        <p className="text-[#A9B2C7] mb-6">{error.message}</p>
        <button
          onClick={() => refetch()}
          className="px-6 py-3 bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] text-[#05070B] font-bold rounded-lg hover:shadow-lg transition-all"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Gerenciar Enquetes</h2>
          {data?.notes?.source === 'entities' && (
            <p className="text-xs text-blue-400 mt-1">
              • Modo compatível: dados carregados diretamente do banco
            </p>
          )}
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] text-[#05070B] font-bold rounded-lg hover:shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          Criar Enquete
        </button>
      </div>

      {/* Filters */}
      <GlowCard className="p-6">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A9B2C7]" />
            <Input
              placeholder="Buscar por título..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-[#05070B] border-[#19E0FF]/20 text-white"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-[#05070B] border-[#19E0FF]/20 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="ACTIVE">Ativa</SelectItem>
              <SelectItem value="DRAFT">Rascunho</SelectItem>
              <SelectItem value="CLOSED">Encerrada</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="bg-[#05070B] border-[#19E0FF]/20 text-white">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mais recentes</SelectItem>
              <SelectItem value="oldest">Mais antigas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </GlowCard>

      {/* Enquetes Table */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 bg-[#19E0FF]/10" />
          ))}
          <p className="text-center text-[#A9B2C7] text-sm mt-4">Carregando enquetes...</p>
        </div>
      ) : data?.items?.length > 0 ? (
        <GlowCard className="p-6">
          <div className="space-y-4">
            {data.items.map((enquete, index) => (
              <motion.div
                key={enquete.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 bg-[#05070B] rounded-lg hover:bg-[#0C121C] transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-white font-bold">{enquete.title}</h3>
                    {statusBadge(enquete.status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[#A9B2C7]">
                    <span>{enquete.options?.length || 0} opções</span>
                    <span>•</span>
                    <span>{enquete.totalVotes || 0} votos</span>
                    <span>•</span>
                    <span>
                      Criada em {new Date(enquete.created_date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(enquete)}
                    className="p-2 text-[#19E0FF] hover:bg-[#19E0FF]/10 rounded-lg transition-colors"
                  >
                    <Pencil className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(enquete)}
                    className="p-2 text-[#FF4B6A] hover:bg-[#FF4B6A]/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </GlowCard>
      ) : (
        <div className="text-center py-16">
          <BarChart3 className="w-16 h-16 text-[#A9B2C7]/30 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Nenhuma enquete encontrada</h3>
          <p className="text-[#A9B2C7]">
            {search || statusFilter !== 'all'
              ? 'Tente ajustar os filtros.'
              : 'Crie a primeira enquete para começar.'}
          </p>
        </div>
      )}

      {/* Modals */}
      {showFormModal && (
        <EnqueteFormModal
          enquete={editingEnquete}
          onClose={() => {
            setShowFormModal(false);
            setEditingEnquete(null);
          }}
          onSubmit={handleFormSubmit}
          loading={createMutation.isPending || updateMutation.isPending}
        />
      )}

      {deletingEnquete && (
        <DeleteEnqueteModal
          enquete={deletingEnquete}
          onClose={() => setDeletingEnquete(null)}
          onConfirm={handleConfirmDelete}
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}