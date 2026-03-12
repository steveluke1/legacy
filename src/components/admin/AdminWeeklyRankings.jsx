import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar, Trophy, DollarSign, Check, X, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function AdminWeeklyRankings() {
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [payoutToUpdate, setPayoutToUpdate] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const queryClient = useQueryClient();

  // List all weeks
  const { data: weeksData, isLoading: weeksLoading } = useQuery({
    queryKey: ['admin-weekly-snapshots'],
    queryFn: async () => {
      const response = await base44.functions.invoke('rankings_listWeeklySnapshots');
      return response.data;
    }
  });

  // Get week detail
  const { data: weekDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['admin-week-detail', selectedWeek],
    queryFn: async () => {
      if (!selectedWeek) return null;
      const response = await base44.functions.invoke('rankings_adminGetWeekDetail', {
        week_key: selectedWeek
      });
      return response.data;
    },
    enabled: !!selectedWeek
  });

  // Close week mutation
  const closeWeekMutation = useMutation({
    mutationFn: async (weekKey) => {
      const response = await base44.functions.invoke('rankings_adminCloseWeek', {
        week_key: weekKey
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-weekly-snapshots']);
      toast.success('Semana fechada com sucesso!');
    },
    onError: (error) => {
      toast.error(`Erro ao fechar semana: ${error.message}`);
    }
  });

  // Update payout mutation
  const updatePayoutMutation = useMutation({
    mutationFn: async ({ payout_id, status, audit_note }) => {
      const response = await base44.functions.invoke('rankings_adminSetPayoutStatus', {
        payout_id,
        status,
        audit_note
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-week-detail', selectedWeek]);
      queryClient.invalidateQueries(['admin-weekly-snapshots']);
      toast.success('Status do pagamento atualizado!');
      setPayoutToUpdate(null);
      setConfirmAction(null);
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar pagamento: ${error.message}`);
    }
  });

  const handleCloseWeek = () => {
    if (confirmAction?.type === 'close') {
      closeWeekMutation.mutate(null);
      setConfirmAction(null);
    }
  };

  const handleUpdatePayout = () => {
    if (payoutToUpdate && confirmAction) {
      updatePayoutMutation.mutate({
        payout_id: payoutToUpdate.id,
        status: confirmAction.status,
        audit_note: confirmAction.audit_note
      });
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      open: { label: 'Aberta', color: 'bg-blue-500' },
      closed: { label: 'Fechada', color: 'bg-yellow-500' },
      approved: { label: 'Aprovada', color: 'bg-green-500' },
      paid_partial: { label: 'Pago Parcial', color: 'bg-orange-500' },
      paid_done: { label: 'Pago Completo', color: 'bg-green-600' }
    };
    const variant = variants[status] || { label: status, color: 'bg-gray-500' };
    return <Badge className={`${variant.color} text-white`}>{variant.label}</Badge>;
  };

  const getPayoutStatusBadge = (status) => {
    const variants = {
      pending: { label: 'Pendente', color: 'bg-yellow-500' },
      paid: { label: 'Pago', color: 'bg-green-500' },
      void: { label: 'Anulado', color: 'bg-red-500' }
    };
    const variant = variants[status] || { label: status, color: 'bg-gray-500' };
    return <Badge className={`${variant.color} text-white`}>{variant.label}</Badge>;
  };

  if (weeksLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-[#19E0FF]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Premiações Semanais</h2>
          <p className="text-[#A9B2C7]">Gerencie fechamentos semanais e pagamentos</p>
        </div>
        <Button
          onClick={() => setConfirmAction({ type: 'close' })}
          className="bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] text-[#05070B]"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Fechar Semana Atual
        </Button>
      </div>

      {/* Weeks List */}
      <Card className="bg-[#0C121C] border-[#19E0FF]/20 p-6">
        <h3 className="text-lg font-bold text-white mb-4">Semanas Registradas</h3>
        <div className="space-y-3">
          {weeksData?.weeks?.map((week) => (
            <div
              key={week.week_key}
              onClick={() => setSelectedWeek(week.week_key)}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                selectedWeek === week.week_key
                  ? 'border-[#19E0FF] bg-[#19E0FF]/10'
                  : 'border-[#19E0FF]/20 hover:border-[#19E0FF]/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-bold">{week.week_key}</h4>
                  <p className="text-[#A9B2C7] text-sm">
                    {new Date(week.period_start).toLocaleDateString('pt-BR')} - {new Date(week.period_end).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex gap-2">
                  {week.snapshots?.map((snapshot) => (
                    <div key={snapshot.type} className="text-xs">
                      {getStatusBadge(snapshot.status)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Week Detail */}
      {selectedWeek && (
        <Card className="bg-[#0C121C] border-[#19E0FF]/20 p-6">
          {detailLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-[#19E0FF]" />
            </div>
          ) : (
            <div>
              <h3 className="text-xl font-bold text-white mb-6">Detalhes: {selectedWeek}</h3>

              {/* Totals */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <Card className="bg-[#05070B] border-[#19E0FF]/20 p-4">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-green-500" />
                    <div>
                      <p className="text-[#A9B2C7] text-sm">Total BRL</p>
                      <p className="text-white text-xl font-bold">
                        R$ {weekDetail?.totals?.total_brl?.toFixed(2).replace('.', ',')}
                      </p>
                      <p className="text-[#A9B2C7] text-xs">
                        Pago: R$ {weekDetail?.totals?.paid_brl?.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>
                </Card>
                <Card className="bg-[#05070B] border-[#19E0FF]/20 p-4">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-8 h-8 text-[#F7CE46]" />
                    <div>
                      <p className="text-[#A9B2C7] text-sm">Total CASH</p>
                      <p className="text-white text-xl font-bold">
                        {weekDetail?.totals?.total_cash?.toLocaleString('pt-BR')} CASH
                      </p>
                      <p className="text-[#A9B2C7] text-xs">
                        Pago: {weekDetail?.totals?.paid_cash?.toLocaleString('pt-BR')} CASH
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="payouts" className="w-full">
                <TabsList className="bg-[#05070B] border border-[#19E0FF]/20">
                  <TabsTrigger value="payouts">Pagamentos</TabsTrigger>
                  <TabsTrigger value="corredores">Corredores</TabsTrigger>
                  <TabsTrigger value="matador">Matador</TabsTrigger>
                </TabsList>

                <TabsContent value="payouts" className="mt-4">
                  <div className="space-y-3">
                    {weekDetail?.payouts?.map((payout) => (
                      <Card key={payout.id} className="bg-[#05070B] border-[#19E0FF]/20 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-2xl font-bold" style={{ 
                                color: payout.place === 1 ? '#FFD700' : 
                                       payout.place === 2 ? '#C0C0C0' : 
                                       payout.place === 3 ? '#CD7F32' : '#A9B2C7' 
                              }}>
                                #{payout.place}
                              </span>
                              <div>
                                <p className="text-white font-bold">{payout.nickname}</p>
                                <p className="text-[#A9B2C7] text-sm">{payout.ranking_type}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <p className="text-[#19E0FF] font-bold">{payout.display_amount}</p>
                              {getPayoutStatusBadge(payout.payout_status)}
                            </div>
                          </div>
                          {payout.payout_status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => {
                                  setPayoutToUpdate(payout);
                                  setConfirmAction({ type: 'payout', status: 'paid' });
                                }}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Marcar Pago
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setPayoutToUpdate(payout);
                                  setConfirmAction({ type: 'payout', status: 'void' });
                                }}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Anular
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="corredores" className="mt-4">
                  {weekDetail?.snapshots?.find(s => s.type === 'CORREDORES')?.results?.slice(0, 10).map((player) => (
                    <Card key={player.rank} className="bg-[#05070B] border-[#19E0FF]/20 p-3 mb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-bold text-[#19E0FF] w-8">#{player.rank}</span>
                          <div>
                            <p className="text-white font-bold">{player.nickname}</p>
                            <p className="text-[#F7CE46] text-sm">{player.guild}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">{player.points.toLocaleString('pt-BR')} pts</p>
                          <p className="text-[#A9B2C7] text-sm">{player.dgs} DGs</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </TabsContent>

                <TabsContent value="matador" className="mt-4">
                  {weekDetail?.snapshots?.find(s => s.type === 'MATADOR')?.results?.slice(0, 10).map((player) => (
                    <Card key={player.rank} className="bg-[#05070B] border-[#19E0FF]/20 p-3 mb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl font-bold text-[#FF4B6A] w-8">#{player.rank}</span>
                          <div>
                            <p className="text-white font-bold">{player.nickname}</p>
                            <p className="text-[#F7CE46] text-sm">{player.guild}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">{player.kills.toLocaleString('pt-BR')} kills</p>
                          <p className="text-[#19E0FF] text-sm">{player.nation}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </Card>
      )}

      {/* Confirmation Dialogs */}
      <Dialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent className="bg-[#0C121C] border-[#19E0FF]/20">
          <DialogHeader>
            <DialogTitle className="text-white">
              {confirmAction?.type === 'close' ? 'Fechar Semana' : 'Atualizar Pagamento'}
            </DialogTitle>
            <DialogDescription className="text-[#A9B2C7]">
              {confirmAction?.type === 'close' 
                ? 'Isso irá fechar a semana anterior e criar os snapshots e pagamentos pendentes.'
                : confirmAction?.status === 'paid'
                  ? 'Confirmar que este pagamento foi processado?'
                  : 'Anular este pagamento?'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmAction(null)}>
              Cancelar
            </Button>
            <Button
              onClick={confirmAction?.type === 'close' ? handleCloseWeek : handleUpdatePayout}
              className={confirmAction?.status === 'void' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
            >
              {confirmAction?.type === 'close' ? 'Fechar Semana' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}