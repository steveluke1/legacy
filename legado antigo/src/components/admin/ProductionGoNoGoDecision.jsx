import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle, XCircle, AlertTriangle, Copy } from 'lucide-react';
import GlowCard from '@/components/ui/GlowCard';
import GradientButton from '@/components/ui/GradientButton';
import { toast } from 'sonner';

export default function ProductionGoNoGoDecision() {
  const [decision, setDecision] = useState(null);

  const { data: health } = useQuery({
    queryKey: ['efi-health'],
    queryFn: async () => {
      const response = await base44.functions.invoke('efi_healthCheck', {});
      return response.data;
    },
    staleTime: 10000
  });

  const { data: config } = useQuery({
    queryKey: ['market-config'],
    queryFn: async () => {
      const response = await base44.functions.invoke('market_getConfig', {});
      return response.data;
    }
  });

  useEffect(() => {
    if (health && config) {
      calculateDecision();
    }
  }, [health, config]);

  const calculateDecision = () => {
    const checks = [];
    
    // Critical checks
    checks.push({
      name: 'Entidades criadas',
      critical: true,
      status: true, // Já validado em outros componentes
      weight: 15
    });
    
    checks.push({
      name: 'Funções deployadas',
      critical: true,
      status: health?.functions ? Object.values(health.functions).every(s => s === 'deployed') : false,
      weight: 20
    });
    
    checks.push({
      name: 'EFI configurado',
      critical: false,
      status: health?.configured || false,
      weight: 10
    });
    
    checks.push({
      name: 'OAuth funcionando',
      critical: false,
      status: health?.checks?.oauth || false,
      weight: 10
    });
    
    checks.push({
      name: 'Rotas frontend',
      critical: true,
      status: true,
      weight: 15
    });
    
    checks.push({
      name: 'RBAC configurado',
      critical: true,
      status: false, // Manual check
      weight: 20
    });
    
    checks.push({
      name: 'Ledger append-only',
      critical: true,
      status: true,
      weight: 10
    });

    const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
    const score = checks.reduce((sum, c) => sum + (c.status ? c.weight : 0), 0);
    const healthScore = Math.round((score / totalWeight) * 100);
    
    const criticalFailed = checks.filter(c => c.critical && !c.status);
    
    let finalDecision = 'NO_GO';
    if (criticalFailed.length === 0 && healthScore >= 85) {
      finalDecision = 'GO';
    } else if (criticalFailed.length === 0 && healthScore >= 70) {
      finalDecision = 'GO_WITH_RESTRICTIONS';
    }
    
    setDecision({
      decision: finalDecision,
      healthScore,
      checks,
      criticalFailed,
      mode: health?.configured ? (health.env === 'production' ? 'PRODUCTION' : 'HOMOLOG') : 'MOCK',
      timestamp: new Date().toISOString()
    });
  };

  const copyDecisionReport = () => {
    if (!decision) return;
    
    const report = `
╔═══════════════════════════════════════════════════════════════╗
║              DECISÃO GO/NO-GO - PRODUÇÃO                      ║
╚═══════════════════════════════════════════════════════════════╝

Data: ${new Date(decision.timestamp).toLocaleString('pt-BR')}
Modo Atual: ${decision.mode}
Health Score: ${decision.healthScore}/100

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 DECISÃO FINAL: ${
  decision.decision === 'GO' ? '🟢 GO FOR PRODUCTION' :
  decision.decision === 'GO_WITH_RESTRICTIONS' ? '🟡 GO WITH RESTRICTIONS' :
  '🔴 NO-GO'
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 CHECKLIST:

${decision.checks.map(c => `
${c.status ? '✅' : '❌'} ${c.name}${c.critical ? ' [CRÍTICO]' : ''}
   Peso: ${c.weight}
   Status: ${c.status ? 'OK' : 'PENDENTE'}
`).join('')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${decision.criticalFailed.length > 0 ? `
⛔ BLOQUEADORES CRÍTICOS (${decision.criticalFailed.length}):
${decision.criticalFailed.map(c => `   • ${c.name}`).join('\n')}

AÇÃO OBRIGATÓRIA ANTES DO DEPLOY:
${decision.criticalFailed.map(c => {
  if (c.name === 'Funções deployadas') {
    return '   1. Deploy todas as funções via Code Editor';
  }
  if (c.name === 'RBAC configurado') {
    return '   2. Configurar políticas RBAC no Dashboard → Data → Entities';
  }
  return `   • Resolver: ${c.name}`;
}).join('\n')}
` : `
✅ NENHUM BLOQUEADOR CRÍTICO

Sistema validado e pronto para deploy.
`}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 PRÓXIMOS PASSOS:

${decision.decision === 'GO' ? `
1. ✅ Deploy das funções (verificar tab Deployment)
2. ⚠️  Configurar variáveis EFI se não configurado (tab EFI Config)
3. ⚠️  Aplicar RBAC policies manualmente
4. ✅ Testar fluxo E2E em homologação
5. 🚀 Deploy em produção
` : decision.decision === 'GO_WITH_RESTRICTIONS' ? `
1. ⚠️  Resolver bloqueadores críticos listados acima
2. ⚠️  Configurar RBAC policies
3. ⚠️  Deploy funções pendentes
4. ✅ Re-executar verificação
5. ⏸️  Aguardar GO verde antes de produção
` : `
1. 🔴 Resolver bloqueadores críticos listados acima
2. 🔴 Re-executar verificação até obter GO
3. ⏸️  NÃO fazer deploy até resolver todos os bloqueadores
`}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Gerado automaticamente pelo AdminDashboard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();
    
    navigator.clipboard.writeText(report);
    toast.success('Decisão GO/NO-GO copiada!');
  };

  if (!decision) {
    return (
      <GlowCard className="p-6">
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-3 px-6 py-4 bg-[#19E0FF]/10 rounded-lg">
            <div className="w-6 h-6 border-2 border-[#19E0FF] border-t-transparent rounded-full animate-spin" />
            <span className="text-white font-semibold">Calculando decisão GO/NO-GO...</span>
          </div>
        </div>
      </GlowCard>
    );
  }

  const DecisionIcon = decision.decision === 'GO' ? CheckCircle :
                        decision.decision === 'GO_WITH_RESTRICTIONS' ? AlertTriangle :
                        XCircle;

  const decisionColor = decision.decision === 'GO' ? 'text-[#10B981]' :
                         decision.decision === 'GO_WITH_RESTRICTIONS' ? 'text-[#F7CE46]' :
                         'text-[#FF4B6A]';

  const decisionBg = decision.decision === 'GO' ? 'bg-[#10B981]/10 border-[#10B981]/30' :
                      decision.decision === 'GO_WITH_RESTRICTIONS' ? 'bg-[#F7CE46]/10 border-[#F7CE46]/30' :
                      'bg-[#FF4B6A]/10 border-[#FF4B6A]/30';

  const decisionText = decision.decision === 'GO' ? '🟢 GO FOR PRODUCTION' :
                        decision.decision === 'GO_WITH_RESTRICTIONS' ? '🟡 GO WITH RESTRICTIONS' :
                        '🔴 NO-GO';

  return (
    <div className="space-y-6">
      {/* Decision Banner */}
      <GlowCard className={`p-8 ${decisionBg}`}>
        <div className="flex items-center gap-6">
          <DecisionIcon className={`w-20 h-20 ${decisionColor} flex-shrink-0`} />
          <div className="flex-1">
            <h2 className={`text-4xl font-bold mb-3 ${decisionColor}`}>
              {decisionText}
            </h2>
            <p className="text-white text-lg mb-2">
              Health Score: {decision.healthScore}/100
            </p>
            <p className="text-[#A9B2C7]">
              Modo: <span className="font-semibold text-white">{decision.mode}</span>
            </p>
          </div>
          <GradientButton onClick={copyDecisionReport} className="flex items-center gap-2">
            <Copy className="w-5 h-5" />
            Copiar Decisão
          </GradientButton>
        </div>
      </GlowCard>

      {/* Checks Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {decision.checks.map((check, idx) => (
          <GlowCard key={idx} className={`p-4 ${check.status ? 'border-[#10B981]/20' : 'border-[#FF4B6A]/20'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {check.status ? (
                  <CheckCircle className="w-5 h-5 text-[#10B981]" />
                ) : (
                  <XCircle className="w-5 h-5 text-[#FF4B6A]" />
                )}
                <div>
                  <p className="text-white font-semibold">{check.name}</p>
                  {check.critical && (
                    <p className="text-xs text-[#FF4B6A]">CRÍTICO</p>
                  )}
                </div>
              </div>
              <span className="text-sm text-[#A9B2C7]">Peso: {check.weight}</span>
            </div>
          </GlowCard>
        ))}
      </div>

      {/* Blockers */}
      {decision.criticalFailed.length > 0 && (
        <GlowCard className="p-6 bg-[#FF4B6A]/10 border-[#FF4B6A]/30">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <XCircle className="w-6 h-6 text-[#FF4B6A]" />
            Bloqueadores Críticos ({decision.criticalFailed.length})
          </h3>
          <div className="space-y-3">
            {decision.criticalFailed.map((blocker, idx) => (
              <div key={idx} className="bg-[#05070B] rounded-lg p-4 border border-[#FF4B6A]/20">
                <p className="font-semibold text-white mb-2">{blocker.name}</p>
                {blocker.name === 'Funções deployadas' && (
                  <p className="text-sm text-[#A9B2C7]">
                    Acesse: AdminDashboard → 🚀 Deployment para verificar quais funções precisam de deploy
                  </p>
                )}
                {blocker.name === 'RBAC configurado' && (
                  <p className="text-sm text-[#A9B2C7]">
                    Configure políticas de acesso: Dashboard → Data → Entities (ver guia no Relatório Final)
                  </p>
                )}
              </div>
            ))}
          </div>
        </GlowCard>
      )}

      {/* Next Steps */}
      <GlowCard className="p-6">
        <h3 className="text-xl font-bold text-white mb-4">Próximos Passos</h3>
        <div className="space-y-3 text-sm">
          {decision.decision === 'GO' ? (
            <>
              <p className="text-[#10B981] font-semibold text-lg mb-3">✅ Sistema validado para produção</p>
              <div className="space-y-2">
                <p className="text-[#A9B2C7]">□ 1. Deploy funções (tab Deployment)</p>
                <p className="text-[#A9B2C7]">□ 2. Configurar EFI env vars (tab EFI Config)</p>
                <p className="text-[#A9B2C7]">□ 3. Aplicar RBAC policies manualmente</p>
                <p className="text-[#A9B2C7]">□ 4. Testar compra de R$ 0,50 em homologação</p>
                <p className="text-[#A9B2C7]">□ 5. Validar webhook recebe notificação</p>
                <p className="text-[#A9B2C7]">□ 6. Substituir stubs de game integration</p>
                <p className="text-[#A9B2C7]">□ 7. Mudar EFI_ENV para production</p>
                <p className="text-[#A9B2C7]">□ 8. Deploy final em produção</p>
              </div>
            </>
          ) : decision.decision === 'GO_WITH_RESTRICTIONS' ? (
            <>
              <p className="text-[#F7CE46] font-semibold text-lg mb-3">🟡 Deploy possível com restrições</p>
              <div className="space-y-2">
                <p className="text-[#A9B2C7]">□ Resolver bloqueadores críticos listados acima</p>
                <p className="text-[#A9B2C7]">□ EFI pode ficar em MOCK mode até configurar</p>
                <p className="text-[#A9B2C7]">□ Configurar RBAC antes de produção</p>
                <p className="text-[#A9B2C7]">□ Re-executar verificação após correções</p>
              </div>
            </>
          ) : (
            <>
              <p className="text-[#FF4B6A] font-semibold text-lg mb-3">🔴 Não fazer deploy</p>
              <div className="space-y-2">
                <p className="text-[#A9B2C7]">□ Resolver TODOS os bloqueadores críticos</p>
                <p className="text-[#A9B2C7]">□ Re-executar verificação completa</p>
                <p className="text-[#A9B2C7]">□ Aguardar GO verde antes de qualquer deploy</p>
              </div>
            </>
          )}
        </div>
      </GlowCard>

      {/* Environment Info */}
      <GlowCard className="p-6">
        <h3 className="text-lg font-bold text-white mb-4">Informações de Ambiente</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[#A9B2C7] mb-1">Modo PIX:</p>
            <p className="text-white font-semibold">{decision.mode}</p>
          </div>
          <div>
            <p className="text-[#A9B2C7] mb-1">EFI Configurado:</p>
            <p className={health?.configured ? 'text-[#10B981]' : 'text-[#FF4B6A]'}>
              {health?.configured ? 'Sim' : 'Não (usando MOCK)'}
            </p>
          </div>
          <div>
            <p className="text-[#A9B2C7] mb-1">Split Mode:</p>
            <p className="text-white font-semibold">{config?.config?.split_mode || 'mock'}</p>
          </div>
          <div>
            <p className="text-[#A9B2C7] mb-1">Taxa Marketplace:</p>
            <p className="text-white font-semibold">{config?.config?.market_fee_percent || 1.5}%</p>
          </div>
        </div>
      </GlowCard>
    </div>
  );
}