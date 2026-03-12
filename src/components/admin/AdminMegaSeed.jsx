import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Trash2,
  Sparkles,
  BarChart3,
  Users,
  Shield,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function AdminMegaSeed() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [lastReport, setLastReport] = useState(null);
  const queryClient = useQueryClient();

  // Query for latest seed runs
  const { data: seedRuns, isLoading: runsLoading } = useQuery({
    queryKey: ['admin-seed-runs'],
    queryFn: async () => {
      try {
        const runs = await base44.asServiceRole.entities.SeedRun.list('-created_date', 10);
        return runs || [];
      } catch (err) {
        console.error('Error fetching seed runs:', err);
        return [];
      }
    }
  });

  // Reset and seed mutation
  const resetMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('admin_resetAndSeedMegaV1000');
      return response.data;
    },
    onSuccess: (data) => {
      setLastReport(data);
      queryClient.invalidateQueries(['admin-seed-runs']);
      queryClient.invalidateQueries(['rankings-current']);
      queryClient.invalidateQueries(['admin-weekly-snapshots']);
      
      if (data.success) {
        toast.success('Mega Seed gerado com sucesso! 🎉');
      } else {
        toast.error(`Seed falhou: ${data.error}`);
      }
      
      setShowConfirm(false);
    },
    onError: (error) => {
      toast.error(`Erro ao executar seed: ${error.message}`);
      setShowConfirm(false);
    }
  });

  const handleResetAndSeed = () => {
    resetMutation.mutate();
  };

  const getStatusBadge = (status) => {
    const variants = {
      running: { label: 'Em Execução', color: 'bg-blue-500', icon: Loader2 },
      done: { label: 'Concluído', color: 'bg-green-500', icon: CheckCircle },
      failed: { label: 'Falhou', color: 'bg-red-500', icon: XCircle }
    };
    const variant = variants[status] || { label: status, color: 'bg-gray-500', icon: AlertTriangle };
    const Icon = variant.icon;
    return (
      <Badge className={`${variant.color} text-white flex items-center gap-1`}>
        <Icon className={`w-3 h-3 ${status === 'running' ? 'animate-spin' : ''}`} />
        {variant.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Mega Seed (1.000 Online)</h2>
          <p className="text-[#A9B2C7]">
            Sistema completo de purge e geração de dados de demonstração
          </p>
        </div>
      </div>

      {/* Main Action Card */}
      <Card className="bg-gradient-to-br from-[#0C121C] to-[#05070B] border-[#19E0FF]/30 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#19E0FF] to-[#1A9FE8] rounded-xl flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-[#05070B]" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1">Gerador de Mega Seed</h3>
            <p className="text-[#A9B2C7] text-sm">
              Apaga todos os dados seed/demo e gera um novo ambiente completo
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#05070B] border border-[#19E0FF]/20 rounded-lg p-4">
            <Users className="w-6 h-6 text-[#19E0FF] mb-2" />
            <p className="text-[#A9B2C7] text-xs mb-1">Jogadores Online</p>
            <p className="text-white text-2xl font-bold">1.000</p>
          </div>
          <div className="bg-[#05070B] border border-[#F7CE46]/20 rounded-lg p-4">
            <Shield className="w-6 h-6 text-[#F7CE46] mb-2" />
            <p className="text-[#A9B2C7] text-xs mb-1">Guildas Ativas</p>
            <p className="text-white text-2xl font-bold">40</p>
          </div>
          <div className="bg-[#05070B] border border-[#FF4B6A]/20 rounded-lg p-4">
            <TrendingUp className="w-6 h-6 text-[#FF4B6A] mb-2" />
            <p className="text-[#A9B2C7] text-xs mb-1">Ordens ALZ</p>
            <p className="text-white text-2xl font-bold">800+</p>
          </div>
          <div className="bg-[#05070B] border border-[#19E0FF]/20 rounded-lg p-4">
            <BarChart3 className="w-6 h-6 text-[#19E0FF] mb-2" />
            <p className="text-[#A9B2C7] text-xs mb-1">Eventos Analytics</p>
            <p className="text-white text-2xl font-bold">23K+</p>
          </div>
        </div>

        <div className="bg-[#FF4B6A]/10 border border-[#FF4B6A]/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#FF4B6A] mt-0.5" />
            <div className="flex-1 text-sm text-[#A9B2C7]">
              <p className="font-bold text-[#FF4B6A] mb-1">ATENÇÃO:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Todos os dados marcados com seed serão apagados (rankings, mercado, guildas, analytics demo)</li>
                <li>Usuários reais, admins e configurações NÃO serão afetados</li>
                <li>Um novo ambiente completo será gerado com dados determinísticos</li>
                <li>Processo pode levar 1-2 minutos</li>
              </ul>
            </div>
          </div>
        </div>

        <Button
          onClick={() => setShowConfirm(true)}
          disabled={resetMutation.isPending}
          className="w-full bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] text-[#05070B] font-bold text-lg py-6"
        >
          {resetMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <Trash2 className="w-5 h-5 mr-2" />
              Apagar Seeds e Gerar Mega Seed
            </>
          )}
        </Button>
      </Card>

      {/* Last Report */}
      {lastReport && (
        <Card className="bg-[#0C121C] border-[#19E0FF]/20 p-6">
          <h3 className="text-lg font-bold text-white mb-4">Último Relatório</h3>
          
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-[#05070B] border border-[#FF4B6A]/20 rounded-lg p-4">
              <p className="text-[#A9B2C7] text-sm mb-1">Registros Apagados</p>
              <p className="text-[#FF4B6A] text-3xl font-bold">
                {lastReport.summary?.purged_records?.toLocaleString('pt-BR') || 0}
              </p>
            </div>
            <div className="bg-[#05070B] border border-[#19E0FF]/20 rounded-lg p-4">
              <p className="text-[#A9B2C7] text-sm mb-1">Registros Criados</p>
              <p className="text-[#19E0FF] text-3xl font-bold">
                {lastReport.summary?.created_records?.toLocaleString('pt-BR') || 0}
              </p>
            </div>
            <div className="bg-[#05070B] border border-[#F7CE46]/20 rounded-lg p-4">
              <p className="text-[#A9B2C7] text-sm mb-1">Validações</p>
              <p className="text-[#F7CE46] text-3xl font-bold">
                {lastReport.summary?.validations_passed || 0}/{(lastReport.summary?.validations_passed || 0) + (lastReport.summary?.validations_failed || 0)}
              </p>
            </div>
          </div>

          {lastReport.validation_report?.checks && (
            <div className="space-y-2">
              <h4 className="text-white font-bold text-sm mb-3">Validações:</h4>
              {lastReport.validation_report.checks.map((check, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    check.status === 'PASS'
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {check.status === 'PASS' ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-white text-sm font-medium">{check.name}</span>
                  </div>
                  <span className={`text-sm ${check.status === 'PASS' ? 'text-green-500' : 'text-red-500'}`}>
                    {check.value !== undefined ? check.value : check.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Seed Runs History */}
      <Card className="bg-[#0C121C] border-[#19E0FF]/20 p-6">
        <h3 className="text-lg font-bold text-white mb-4">Histórico de Seeds</h3>
        
        {runsLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-[#19E0FF]" />
          </div>
        ) : seedRuns && seedRuns.length > 0 ? (
          <div className="space-y-3">
            {seedRuns.map((run) => (
              <div
                key={run.id}
                className="bg-[#05070B] border border-[#19E0FF]/20 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[#19E0FF] font-mono text-sm">{run.seed_id}</span>
                    {getStatusBadge(run.status)}
                  </div>
                  <span className="text-[#A9B2C7] text-xs">
                    {new Date(run.started_at).toLocaleString('pt-BR')}
                  </span>
                </div>
                {run.totals && (
                  <div className="flex gap-4 text-xs text-[#A9B2C7]">
                    <span>Apagados: <span className="text-[#FF4B6A] font-bold">{run.totals.purged}</span></span>
                    <span>Criados: <span className="text-[#19E0FF] font-bold">{run.totals.created}</span></span>
                    <span>Validações: <span className="text-[#F7CE46] font-bold">{run.totals.validation_passed}/{run.totals.validation_passed + run.totals.validation_failed}</span></span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[#A9B2C7] text-center py-8">Nenhum seed executado ainda</p>
        )}
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="bg-[#0C121C] border-[#FF4B6A]/30">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#FF4B6A]" />
              Confirmar Reset e Seed
            </DialogTitle>
            <DialogDescription className="text-[#A9B2C7]">
              <div className="space-y-3 mt-4">
                <p className="font-bold text-[#FF4B6A]">
                  Isso apagará TODOS os dados de seed/demo:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Rankings (Corredores, Matador, Hall da Fama)</li>
                  <li>Mercado ALZ (listagens, ordens, trades)</li>
                  <li>Guildas de demonstração (40 guildas)</li>
                  <li>Eventos de analytics demo (~23K eventos)</li>
                  <li>Estatísticas do servidor</li>
                </ul>
                <p className="font-bold text-[#19E0FF] mt-3">
                  E criará uma nova simulação com:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>1.000 jogadores online (exato)</li>
                  <li>40 guildas ativas</li>
                  <li>Rankings completos (top 50 cada)</li>
                  <li>800+ ordens ALZ no mercado</li>
                  <li>23K+ eventos de analytics</li>
                </ul>
                <p className="text-green-500 font-bold mt-3">
                  ✓ Usuários reais e admins NÃO serão afetados
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowConfirm(false)}
              disabled={resetMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleResetAndSeed}
              disabled={resetMutation.isPending}
              className="bg-gradient-to-r from-[#FF4B6A] to-[#8B0000] text-white"
            >
              {resetMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processando...
                </>
              ) : (
                'Confirmar Reset e Seed'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}