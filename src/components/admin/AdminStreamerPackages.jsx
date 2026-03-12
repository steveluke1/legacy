import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminClient } from './adminClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Trash2, AlertTriangle, Power, PowerOff, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AdminStreamerPackages() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    items: [{ label: '', quantity: 1, note: '' }],
    priceCash: 0,
    isActive: true
  });

  // Fetch packages
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['adminStreamerPackages'],
    queryFn: () => adminClient.listStreamerPackages(),
    staleTime: 60000,
    retry: 1,
    refetchOnWindowFocus: false
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (packageData) => adminClient.createStreamerPackage(packageData),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminStreamerPackages']);
      toast.success('Pacote criado com sucesso');
      // Reset form
      setFormData({
        name: '',
        items: [{ label: '', quantity: 1, note: '' }],
        priceCash: 0,
        isActive: true
      });
    },
    onError: (err) => {
      toast.error(err.message || 'Erro ao criar pacote');
    }
  });

  // Toggle active mutation
  const toggleMutation = useMutation({
    mutationFn: ({ packageId, isActive }) => 
      adminClient.toggleStreamerPackageActive(packageId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries(['adminStreamerPackages']);
      toast.success('Status atualizado');
    },
    onError: (err) => {
      toast.error(err.message || 'Erro ao atualizar status');
    }
  });

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { label: '', quantity: 1, note: '' }]
    });
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter((_, i) => i !== index)
      });
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validations
    if (!formData.name || formData.name.trim().length < 3) {
      toast.error('Nome do pacote deve ter pelo menos 3 caracteres');
      return;
    }

    const validItems = formData.items.filter(item => item.label.trim().length > 0);
    if (validItems.length === 0) {
      toast.error('Adicione pelo menos 1 item ao pacote');
      return;
    }

    if (formData.priceCash < 0) {
      toast.error('Preço não pode ser negativo');
      return;
    }

    createMutation.mutate({
      name: formData.name,
      items: validItems,
      priceCash: Number(formData.priceCash),
      isActive: formData.isActive
    });
  };

  if (error?.message?.includes('Não autorizado') || error?.message?.includes('401') || error?.message?.includes('403')) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-[#FF4B6A] mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Sessão expirada</h3>
        <p className="text-[#A9B2C7] mb-6">Faça login novamente para continuar</p>
        <Button 
          onClick={() => window.location.href = '/AdminAuth'}
          className="bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] text-[#05070B] font-bold"
        >
          Ir para Login
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-16 h-16 text-[#FF4B6A] mx-auto mb-4" />
        <p className="text-white mb-2">Não foi possível carregar os pacotes</p>
        <p className="text-[#A9B2C7] text-sm mb-4">{error.message}</p>
        <Button onClick={() => refetch()} variant="outline" className="border-[#19E0FF]/20">
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Create Form */}
      <Card className="p-6 bg-[#0C121C] border-[#19E0FF]/20">
        <h2 className="text-xl font-bold text-white mb-4">Criar Novo Pacote</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-white">Nome do Pacote</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Pacote Streamer ZironLive"
              className="bg-[#05070B] border-[#19E0FF]/20 text-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-white">Itens do Pacote</Label>
              <Button
                type="button"
                size="sm"
                onClick={handleAddItem}
                variant="outline"
                className="border-[#19E0FF]/20"
              >
                <Plus className="w-4 h-4 mr-1" />
                Adicionar item
              </Button>
            </div>
            <div className="space-y-2">
              {formData.items.map((item, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <Input
                      value={item.label}
                      onChange={(e) => handleItemChange(index, 'label', e.target.value)}
                      placeholder="Nome do item"
                      className="bg-[#05070B] border-[#19E0FF]/20 text-white"
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      placeholder="Qtd"
                      min="1"
                      className="bg-[#05070B] border-[#19E0FF]/20 text-white"
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      value={item.note}
                      onChange={(e) => handleItemChange(index, 'note', e.target.value)}
                      placeholder="Observação (opcional)"
                      className="bg-[#05070B] border-[#19E0FF]/20 text-white"
                    />
                  </div>
                  {formData.items.length > 1 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveItem(index)}
                      className="text-[#FF4B6A] hover:text-[#FF4B6A] hover:bg-[#FF4B6A]/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="priceCash" className="text-white">Valor em CASH</Label>
            <Input
              id="priceCash"
              type="number"
              value={formData.priceCash}
              onChange={(e) => setFormData({ ...formData, priceCash: e.target.value })}
              placeholder="0"
              min="0"
              className="bg-[#05070B] border-[#19E0FF]/20 text-white"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
            />
            <Label htmlFor="isActive" className="text-white cursor-pointer">
              Ativo (visível na loja)
            </Label>
          </div>

          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="w-full bg-[#19E0FF] hover:bg-[#19E0FF]/80 text-[#05070B]"
          >
            {createMutation.isPending ? 'Criando...' : 'Criar Pacote'}
          </Button>
        </form>
      </Card>

      {/* Packages List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Pacotes Existentes</h2>
          {data?.notes?.source === 'entities' && (
            <p className="text-xs text-blue-400">
              • Modo compatível: dados carregados diretamente do banco
            </p>
          )}
        </div>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 bg-[#19E0FF]/10" />
            ))}
            <p className="text-center text-[#A9B2C7] text-sm mt-4">Carregando pacotes...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data?.packages?.length === 0 ? (
              <Card className="p-8 text-center bg-[#0C121C] border-[#19E0FF]/20">
                <p className="text-[#A9B2C7]">Nenhum pacote criado ainda</p>
              </Card>
            ) : (
              data?.packages?.map((pkg) => (
                <Card key={pkg.id} className="p-6 bg-[#0C121C] border-[#19E0FF]/20">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-white">{pkg.name}</h3>
                        <Badge className={pkg.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                          {pkg.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <p className="text-[#F7CE46] font-bold text-lg">
                        {pkg.price_cash.toLocaleString('pt-BR')} ⬥ CASH
                      </p>
                      <p className="text-[#A9B2C7] text-sm mt-1">
                        Criado em: {format(new Date(pkg.created_date), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleMutation.mutate({ 
                        packageId: pkg.id, 
                        isActive: !pkg.is_active 
                      })}
                      disabled={toggleMutation.isPending}
                      className="border-[#19E0FF]/20"
                    >
                      {pkg.is_active ? (
                        <>
                          <PowerOff className="w-4 h-4 mr-1" />
                          Desativar
                        </>
                      ) : (
                        <>
                          <Power className="w-4 h-4 mr-1" />
                          Ativar
                        </>
                      )}
                    </Button>
                  </div>

                  <div>
                    <p className="text-[#A9B2C7] text-sm mb-2">Itens incluídos ({pkg.items.length}):</p>
                    <ul className="space-y-1">
                      {pkg.items.map((item, idx) => (
                        <li key={idx} className="text-white text-sm flex items-center gap-2">
                          <span className="text-[#19E0FF]">•</span>
                          {item.label}
                          {item.quantity && item.quantity > 1 && (
                            <span className="text-[#A9B2C7]">({item.quantity}x)</span>
                          )}
                          {item.note && (
                            <span className="text-[#A9B2C7] text-xs">- {item.note}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}