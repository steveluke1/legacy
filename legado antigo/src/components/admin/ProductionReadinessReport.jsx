import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Shield, Activity } from 'lucide-react';

export default function ProductionReadinessReport({ summary, results }) {
  if (!summary || !results || results.length === 0) return null;

  const blockers = results.filter(r => r.blocker);
  const criticalErrors = results.filter(r => r.critical && r.status !== 'ok');
  const authTests = results.filter(r => r.category === 'Auth');
  const rbacTests = results.filter(r => r.category === 'RBAC');
  const dataIntegrityTests = results.filter(r => r.category === 'Data Integrity');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Go/No-Go Decision */}
      <div className={`p-8 rounded-xl border-2 ${
        summary.productionReady 
          ? 'bg-[#10B981]/10 border-[#10B981]/50' 
          : 'bg-[#FF4B6A]/10 border-[#FF4B6A]/50'
      }`}>
        <div className="flex items-center gap-4 mb-4">
          {summary.productionReady ? (
            <CheckCircle className="w-12 h-12 text-[#10B981]" />
          ) : (
            <XCircle className="w-12 h-12 text-[#FF4B6A]" />
          )}
          <div>
            <h2 className={`text-3xl font-bold ${
              summary.productionReady ? 'text-[#10B981]' : 'text-[#FF4B6A]'
            }`}>
              {summary.productionReady ? '✅ GO PARA PRODUÇÃO' : '⛔ NO-GO - BLOCKERS DETECTADOS'}
            </h2>
            <p className="text-[#A9B2C7] mt-2">
              {summary.productionReady 
                ? 'O sistema passou em todos os testes críticos e está pronto para deploy.'
                : 'O sistema possui bloqueadores que impedem o deploy em produção.'}
            </p>
          </div>
        </div>

        {!summary.productionReady && (
          <div className="mt-4 p-4 bg-[#05070B] rounded-lg">
            <p className="text-white font-bold mb-2">Ação Necessária:</p>
            <ol className="text-[#A9B2C7] text-sm space-y-1 list-decimal list-inside">
              <li>Configurar RBAC para entidades sensíveis via dashboard Base44</li>
              <li>Seguir checklist de RBAC detalhado (copie o relatório)</li>
              <li>Re-executar varredura até 0 blockers</li>
              <li>Testar fluxos críticos E2E em staging</li>
            </ol>
          </div>
        )}
      </div>

      {/* Blockers Section */}
      {blockers.length > 0 && (
        <div className="p-6 bg-[#8B0000]/20 border-2 border-[#FF4B6A]/50 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-6 h-6 text-[#FF4B6A]" />
            <h3 className="text-xl font-bold text-white">
              ⛔ BLOCKERS CRÍTICOS ({blockers.length})
            </h3>
          </div>
          <div className="space-y-2">
            {blockers.map((blocker, i) => (
              <div key={i} className="p-3 bg-[#05070B] rounded border border-[#FF4B6A]/30">
                <p className="text-white font-semibold text-sm">{blocker.name}</p>
                <p className="text-[#A9B2C7] text-xs mt-1">{blocker.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Critical Functions Section */}
      {criticalErrors.length > 0 && (
        <div className="p-6 bg-[#F7CE46]/10 border border-[#F7CE46]/30 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-6 h-6 text-[#F7CE46]" />
            <h3 className="text-xl font-bold text-white">
              ⚠️ FUNÇÕES CRÍTICAS REQUEREM TESTE E2E ({criticalErrors.length})
            </h3>
          </div>
          <p className="text-[#A9B2C7] text-sm mb-4">
            Estas funções envolvem economia/pagamento e devem ser testadas em staging antes de produção.
          </p>
          <div className="space-y-2">
            {criticalErrors.map((fn, i) => (
              <div key={i} className="p-3 bg-[#05070B] rounded border border-[#F7CE46]/30">
                <p className="text-white font-semibold text-sm">{fn.name}</p>
                <p className="text-[#A9B2C7] text-xs mt-1">{fn.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Auth Status */}
      <div className="p-6 bg-[#0C121C] border border-[#19E0FF]/20 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-6 h-6 text-[#19E0FF]" />
          <h3 className="text-xl font-bold text-white">Autenticação</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-[#A9B2C7] text-sm mb-2">User Auth:</p>
            <div className="space-y-1">
              {authTests.filter(t => t.name.includes('User')).map((test, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {test.status === 'ok' ? (
                    <CheckCircle className="w-4 h-4 text-[#10B981]" />
                  ) : (
                    <XCircle className="w-4 h-4 text-[#FF4B6A]" />
                  )}
                  <span className="text-[#A9B2C7]">{test.name.replace('User Auth: ', '')}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[#A9B2C7] text-sm mb-2">Admin Auth:</p>
            <div className="space-y-1">
              {authTests.filter(t => t.name.includes('Admin')).map((test, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  {test.status === 'ok' ? (
                    <CheckCircle className="w-4 h-4 text-[#10B981]" />
                  ) : (
                    <XCircle className="w-4 h-4 text-[#FF4B6A]" />
                  )}
                  <span className="text-[#A9B2C7]">{test.name.replace('Admin Auth: ', '')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RBAC Status */}
      <div className="p-6 bg-[#0C121C] border border-[#19E0FF]/20 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-6 h-6 text-[#19E0FF]" />
          <h3 className="text-xl font-bold text-white">RBAC - Controle de Acesso</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {rbacTests.map((test, i) => (
            <div 
              key={i} 
              className={`p-3 rounded border ${
                test.status === 'ok' 
                  ? 'bg-[#10B981]/10 border-[#10B981]/30'
                  : 'bg-[#FF4B6A]/10 border-[#FF4B6A]/30'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {test.status === 'ok' ? (
                  <CheckCircle className="w-4 h-4 text-[#10B981]" />
                ) : (
                  <XCircle className="w-4 h-4 text-[#FF4B6A]" />
                )}
                <p className="text-white font-semibold text-sm">{test.name}</p>
              </div>
              <p className="text-[#A9B2C7] text-xs">{test.message}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Data Integrity */}
      <div className="p-6 bg-[#0C121C] border border-[#19E0FF]/20 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-6 h-6 text-[#19E0FF]" />
          <h3 className="text-xl font-bold text-white">Integridade de Dados</h3>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {dataIntegrityTests.map((test, i) => (
            <div 
              key={i} 
              className={`p-3 rounded border ${
                test.status === 'ok' 
                  ? 'bg-[#10B981]/10 border-[#10B981]/30'
                  : 'bg-[#FF4B6A]/10 border-[#FF4B6A]/30'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                {test.status === 'ok' ? (
                  <CheckCircle className="w-4 h-4 text-[#10B981]" />
                ) : (
                  <XCircle className="w-4 h-4 text-[#FF4B6A]" />
                )}
                <p className="text-white font-semibold text-sm">{test.name}</p>
              </div>
              <p className="text-[#A9B2C7] text-xs">{test.message}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Health Score Summary */}
      <div className="p-6 bg-[#0C121C] border border-[#19E0FF]/20 rounded-lg">
        <h3 className="text-xl font-bold text-white mb-4">Score de Saúde do Sistema</h3>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className={`text-6xl font-bold ${
              summary.healthScore >= 90 ? 'text-[#10B981]' :
              summary.healthScore >= 70 ? 'text-[#F7CE46]' :
              'text-[#FF4B6A]'
            }`}>
              {summary.healthScore}%
            </div>
            <p className="text-[#A9B2C7] text-sm mt-2">Health Score</p>
          </div>
          <div className="flex-1">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#10B981]">✓ Sucessos</span>
                <span className="text-white font-bold">{summary.totalOk}/{summary.total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#F7CE46]">⚠ Avisos</span>
                <span className="text-white font-bold">{summary.totalWarning}/{summary.total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#FF4B6A]">✗ Erros</span>
                <span className="text-white font-bold">{summary.totalError}/{summary.total}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-[#19E0FF]/20 pt-2">
                <span className="text-[#FF4B6A]">⛔ Blockers</span>
                <span className="text-white font-bold">{summary.totalBlockers}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final Recommendation */}
      <div className={`p-6 rounded-lg border ${
        summary.productionReady 
          ? 'bg-[#10B981]/10 border-[#10B981]/30'
          : 'bg-[#FF4B6A]/10 border-[#FF4B6A]/30'
      }`}>
        <h3 className="text-xl font-bold text-white mb-2">Recomendação Final</h3>
        <p className="text-[#A9B2C7] text-sm">
          {summary.productionReady ? (
            <>
              ✅ O sistema está <span className="text-[#10B981] font-bold">PRONTO PARA PRODUÇÃO</span>.
              Todos os testes críticos passaram. Recomenda-se:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Executar testes E2E de fluxos críticos em staging</li>
                <li>Validar integrações de pagamento (PIX/webhooks)</li>
                <li>Configurar monitoramento de produção</li>
                <li>Preparar plano de rollback</li>
              </ul>
            </>
          ) : (
            <>
              ⛔ O sistema <span className="text-[#FF4B6A] font-bold">NÃO ESTÁ PRONTO</span> para produção.
              Ações necessárias:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Resolver {summary.totalBlockers} blocker(s) crítico(s)</li>
                {criticalErrors.length > 0 && <li>Testar {criticalErrors.length} função(ões) crítica(s) E2E</li>}
                <li>Re-executar varredura completa</li>
                <li>Atingir health score mínimo de 85%</li>
              </ul>
            </>
          )}
        </p>
      </div>
    </motion.div>
  );
}