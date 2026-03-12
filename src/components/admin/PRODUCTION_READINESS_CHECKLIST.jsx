import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Circle, Shield, Zap, Activity, Database, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlowCard from '@/components/ui/GlowCard';
import { toast } from 'sonner';

const CHECKLIST = {
  frontend: [
    { id: 'f1', task: 'Todas rotas renderizam sem crash', status: 'done' },
    { id: 'f2', task: 'Loading/Error/Empty states consistentes', status: 'done' },
    { id: 'f3', task: 'React Query otimizado (staleTime 30-60s)', status: 'done' },
    { id: 'f4', task: 'refetchOnWindowFocus = false em tabs pesadas', status: 'done' },
    { id: 'f5', task: 'ErrorBoundaries implementados', status: 'done' },
    { id: 'f6', task: 'Zero console errors em rotas principais', status: 'done' },
    { id: 'f7', task: 'Auth redirect em 401/403', status: 'done' },
    { id: 'f8', task: 'Retry buttons conectados', status: 'done' },
    { id: 'f9', task: 'Mobile testing (360x640, 390x844, 414x896)', status: 'pending' },
    { id: 'f10', task: 'Overflow horizontal verificado', status: 'pending' },
    { id: 'f11', task: 'Tap targets >= 44px validado', status: 'pending' },
    { id: 'f12', task: 'Safe-area iOS testado', status: 'pending' }
  ],
  backend: [
    { id: 'b1', task: 'Auth functions (user) operacionais', status: 'done' },
    { id: 'b2', task: 'Auth functions (admin) operacionais', status: 'done' },
    { id: 'b3', task: 'Admin data gateway robusto', status: 'done' },
    { id: 'b4', task: 'CorrelationId em funções críticas', status: 'done' },
    { id: 'b5', task: 'Idempotency em webhooks', status: 'done' },
    { id: 'b6', task: 'Idempotency em premium purchase', status: 'done' },
    { id: 'b7', task: 'Economy functions testadas E2E', status: 'pending' },
    { id: 'b8', task: 'Webhook idempotency validada (2x payload)', status: 'pending' },
    { id: 'b9', task: 'PIX webhook signature validation', status: 'blocker' },
    { id: 'b10', task: 'Rate limiting implementado', status: 'pending' }
  ],
  security: [
    { id: 's1', task: 'RBAC: AdminUser', status: 'blocker' },
    { id: 's2', task: 'RBAC: AdminSession', status: 'blocker' },
    { id: 's3', task: 'RBAC: CashLedger', status: 'blocker' },
    { id: 's4', task: 'RBAC: PaymentTransaction', status: 'blocker' },
    { id: 's5', task: 'RBAC: AnalyticsEvent', status: 'blocker' },
    { id: 's6', task: 'RBAC: CommerceEvent', status: 'blocker' },
    { id: 's7', task: 'RBAC: StoreOrder', status: 'pending' },
    { id: 's8', task: 'RBAC: GameAccount', status: 'pending' },
    { id: 's9', task: 'RBAC: UserAccount', status: 'pending' },
    { id: 's10', task: 'Function-level authorization validada', status: 'done' },
    { id: 's11', task: 'CORS policy configurado', status: 'pending' }
  ],
  data: [
    { id: 'd1', task: 'StoreOrder schema validado', status: 'done' },
    { id: 'd2', task: 'GameAccount schema validado', status: 'done' },
    { id: 'd3', task: 'CashLedger entries criados corretamente', status: 'pending' },
    { id: 'd4', task: 'AlzSellOrder lock/unlock funcional', status: 'pending' },
    { id: 'd5', task: 'Wallet invariants verificados', status: 'pending' },
    { id: 'd6', task: 'No PII leakage em public lists', status: 'pending' }
  ],
  performance: [
    { id: 'p1', task: 'Initial load < 2s', status: 'done' },
    { id: 'p2', task: 'Admin tab switch < 500ms', status: 'done' },
    { id: 'p3', task: 'Function call < 600ms', status: 'done' },
    { id: 'p4', task: 'Entity fallback < 1500ms', status: 'done' },
    { id: 'p5', task: 'Lighthouse score >= 90', status: 'pending' },
    { id: 'p6', task: 'Bundle size optimizado', status: 'pending' },
    { id: 'p7', task: 'Pagination em listas > 100 items', status: 'pending' }
  ]
};

export default function ProductionReadinessChecklist() {
  const [checkedOverrides, setCheckedOverrides] = useState({});

  const getStatus = (id, defaultStatus) => {
    if (checkedOverrides[id] !== undefined) {
      return checkedOverrides[id];
    }
    return defaultStatus;
  };

  const toggleCheck = (id, currentStatus) => {
    if (currentStatus === 'done' || currentStatus === 'blocker') return; // Can't toggle done/blocker items
    setCheckedOverrides(prev => ({
      ...prev,
      [id]: prev[id] === 'done' ? 'pending' : 'done'
    }));
  };

  const calculateProgress = (items) => {
    const total = items.length;
    const done = items.filter(item => getStatus(item.id, item.status) === 'done').length;
    return { done, total, percentage: Math.round((done / total) * 100) };
  };

  const allProgress = Object.entries(CHECKLIST).reduce((acc, [category, items]) => {
    const progress = calculateProgress(items);
    acc.total += progress.total;
    acc.done += progress.done;
    acc.blockers += items.filter(item => getStatus(item.id, item.status) === 'blocker').length;
    acc.pending += items.filter(item => getStatus(item.id, item.status) === 'pending').length;
    return acc;
  }, { total: 0, done: 0, blockers: 0, pending: 0 });

  const overallPercentage = Math.round((allProgress.done / allProgress.total) * 100);
  const productionReady = allProgress.blockers === 0 && overallPercentage >= 90;

  const copyChecklistReport = () => {
    const report = `
CHECKLIST DE PRONTIDÃO PARA PRODUÇÃO - CABAL ZIRON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Status Geral: ${productionReady ? '✅ PRONTO' : '⛔ NÃO PRONTO'}
Progresso: ${overallPercentage}%
Concluídos: ${allProgress.done}/${allProgress.total}
Blockers: ${allProgress.blockers}
Pendentes: ${allProgress.pending}

${Object.entries(CHECKLIST).map(([category, items]) => {
  const progress = calculateProgress(items);
  return `
${category.toUpperCase()}:
Progresso: ${progress.percentage}% (${progress.done}/${progress.total})

${items.map((item, i) => {
  const status = getStatus(item.id, item.status);
  const icon = status === 'done' ? '✅' : status === 'blocker' ? '⛔' : '⏳';
  return `${icon} ${item.task}`;
}).join('\n')}
`;
}).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRÓXIMAS AÇÕES:
${allProgress.blockers > 0 ? `1. Resolver ${allProgress.blockers} blocker(s) crítico(s)` : '✅ Sem blockers'}
${allProgress.pending > 0 ? `2. Completar ${allProgress.pending} item(s) pendente(s)` : '✅ Sem pendentes'}
3. Re-executar varredura completa
4. Confirmar production-ready = true

Data: ${new Date().toLocaleString('pt-BR')}
`;

    navigator.clipboard.writeText(report);
    toast.success('Checklist copiado!');
  };

  const StatusIcon = ({ status }) => {
    if (status === 'done') return <CheckCircle className="w-5 h-5 text-[#10B981]" />;
    if (status === 'blocker') return <XCircle className="w-5 h-5 text-[#FF4B6A]" />;
    return <Circle className="w-5 h-5 text-[#A9B2C7]" />;
  };

  const categoryIcons = {
    frontend: Shield,
    backend: Zap,
    security: Shield,
    data: Database,
    performance: Activity
  };

  const categoryLabels = {
    frontend: 'Frontend',
    backend: 'Backend',
    security: 'Segurança',
    data: 'Dados',
    performance: 'Performance'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Checklist de Prontidão</h2>
          <p className="text-[#A9B2C7] text-sm mt-1">
            Validação completa para deploy em produção
          </p>
        </div>
        <Button
          onClick={copyChecklistReport}
          variant="outline"
          className="border-[#19E0FF]/20 text-[#19E0FF]"
        >
          <Copy className="w-4 h-4 mr-2" />
          Copiar Report
        </Button>
      </div>

      {/* Overall Status */}
      <GlowCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Status Geral</h3>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
              productionReady 
                ? 'bg-[#10B981]/20 border border-[#10B981]/50'
                : 'bg-[#FF4B6A]/20 border border-[#FF4B6A]/50'
            }`}>
              {productionReady ? (
                <>
                  <CheckCircle className="w-5 h-5 text-[#10B981]" />
                  <span className="text-[#10B981] font-bold">✅ PRONTO PARA PRODUÇÃO</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-[#FF4B6A]" />
                  <span className="text-[#FF4B6A] font-bold">⛔ NÃO PRONTO</span>
                </>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className={`text-5xl font-bold ${
              overallPercentage >= 90 ? 'text-[#10B981]' :
              overallPercentage >= 70 ? 'text-[#F7CE46]' :
              'text-[#FF4B6A]'
            }`}>
              {overallPercentage}%
            </div>
            <p className="text-[#A9B2C7] text-sm">{allProgress.done}/{allProgress.total} itens</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-[#10B981]/10 rounded-lg">
            <p className="text-2xl font-bold text-[#10B981]">{allProgress.done}</p>
            <p className="text-[#A9B2C7] text-xs">Concluídos</p>
          </div>
          <div className="text-center p-3 bg-[#FF4B6A]/10 rounded-lg">
            <p className="text-2xl font-bold text-[#FF4B6A]">{allProgress.blockers}</p>
            <p className="text-[#A9B2C7] text-xs">⛔ Blockers</p>
          </div>
          <div className="text-center p-3 bg-[#A9B2C7]/10 rounded-lg">
            <p className="text-2xl font-bold text-[#A9B2C7]">{allProgress.pending}</p>
            <p className="text-[#A9B2C7] text-xs">Pendentes</p>
          </div>
        </div>
      </GlowCard>

      {/* Checklists by Category */}
      {Object.entries(CHECKLIST).map(([category, items]) => {
        const Icon = categoryIcons[category];
        const progress = calculateProgress(items);
        const blockers = items.filter(item => getStatus(item.id, item.status) === 'blocker').length;

        return (
          <GlowCard key={category} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Icon className="w-6 h-6 text-[#19E0FF]" />
                <h3 className="text-lg font-bold text-white">{categoryLabels[category]}</h3>
                {blockers > 0 && (
                  <span className="px-2 py-1 bg-[#FF4B6A]/20 text-[#FF4B6A] text-xs rounded font-bold">
                    {blockers} BLOCKER{blockers > 1 ? 'S' : ''}
                  </span>
                )}
              </div>
              <div className={`text-xl font-bold ${
                progress.percentage === 100 ? 'text-[#10B981]' :
                progress.percentage >= 70 ? 'text-[#F7CE46]' :
                'text-[#FF4B6A]'
              }`}>
                {progress.percentage}%
              </div>
            </div>

            <div className="space-y-2">
              {items.map((item, i) => {
                const status = getStatus(item.id, item.status);
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      status === 'done' 
                        ? 'bg-[#10B981]/10 border-[#10B981]/30'
                        : status === 'blocker'
                          ? 'bg-[#FF4B6A]/10 border-[#FF4B6A]/50 border-2'
                          : 'bg-[#05070B] border-[#19E0FF]/20 hover:border-[#19E0FF]/40'
                    }`}
                    onClick={() => toggleCheck(item.id, status)}
                  >
                    <div className="flex items-center gap-3">
                      <StatusIcon status={status} />
                      <p className={`text-sm flex-1 ${
                        status === 'done' ? 'text-white line-through' : 'text-white'
                      }`}>
                        {item.task}
                      </p>
                      {status === 'blocker' && (
                        <span className="text-xs px-2 py-1 bg-[#FF4B6A]/20 text-[#FF4B6A] rounded font-bold">
                          ⛔ BLOCKER
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </GlowCard>
        );
      })}

      {/* Final Actions */}
      {!productionReady && (
        <GlowCard className="p-6 bg-[#FF4B6A]/10 border-[#FF4B6A]/50">
          <h3 className="text-lg font-bold text-white mb-4">⛔ Ações Necessárias para Deploy</h3>
          <ol className="space-y-2 text-sm text-[#A9B2C7] list-decimal list-inside">
            {allProgress.blockers > 0 && (
              <li>
                <span className="text-[#FF4B6A] font-bold">
                  Resolver {allProgress.blockers} blocker(s) crítico(s)
                </span> - Vá para tab "RBAC Config"
              </li>
            )}
            {allProgress.pending > 0 && (
              <li>
                Completar {allProgress.pending} item(s) pendente(s)
              </li>
            )}
            <li>Re-executar "Varredura" completa</li>
            <li>Confirmar production-ready = true</li>
            <li>Executar testes E2E em staging</li>
          </ol>
        </GlowCard>
      )}

      {productionReady && (
        <GlowCard className="p-6 bg-[#10B981]/10 border-[#10B981]/50">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-[#10B981] mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">
              ✅ Sistema Pronto para Produção!
            </h3>
            <p className="text-[#A9B2C7]">
              Todos os itens críticos foram concluídos. Prossiga com deploy.
            </p>
          </div>
        </GlowCard>
      )}
    </div>
  );
}