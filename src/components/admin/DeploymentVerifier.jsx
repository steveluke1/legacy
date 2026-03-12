import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle, XCircle, Play, Copy } from 'lucide-react';
import GlowCard from '@/components/ui/GlowCard';
import GradientButton from '@/components/ui/GradientButton';
import { toast } from 'sonner';

export default function DeploymentVerifier() {
  const [results, setResults] = useState(null);
  const [testing, setTesting] = useState(false);

  const criticalFunctions = [
    { name: 'market_getConfig', category: 'Config' },
    { name: 'buyer_createOrder', category: 'Compra' },
    { name: 'market_createPixChargeForAlzOrder', category: 'PIX' },
    { name: 'efi_pixWebhook', category: 'Webhook' },
    { name: 'efi_healthCheck', category: 'Admin' },
    { name: 'delivery_run', category: 'Entrega' },
    { name: 'admin_setMarketFeePercent', category: 'Admin' },
    { name: 'seller_upsertProfile', category: 'Vendedor' },
    { name: 'market_createAlzListing', category: 'Vendedor' },
    { name: 'seller_cancelListing', category: 'Vendedor' }
  ];

  const runDeploymentCheck = async () => {
    setTesting(true);
    const checks = [];
    
    for (const func of criticalFunctions) {
      const startTime = Date.now();
      try {
        await base44.functions.invoke(func.name, { __deploymentCheck: true });
        checks.push({
          name: func.name,
          category: func.category,
          status: 'deployed',
          timeMs: Date.now() - startTime
        });
      } catch (error) {
        const isNotDeployed = error.message?.includes('Deployment does not exist') || 
                             error.message?.includes('404') ||
                             error.response?.status === 404;
        
        checks.push({
          name: func.name,
          category: func.category,
          status: isNotDeployed ? 'not_deployed' : 'deployed',
          error: error.message,
          timeMs: Date.now() - startTime
        });
      }
    }

    const deployed = checks.filter(c => c.status === 'deployed').length;
    const notDeployed = checks.filter(c => c.status === 'not_deployed').length;
    
    setResults({
      checks,
      summary: {
        total: checks.length,
        deployed,
        notDeployed,
        score: Math.round((deployed / checks.length) * 100)
      }
    });
    
    setTesting(false);
    
    if (notDeployed > 0) {
      toast.error(`${notDeployed} função(ões) não deployada(s)`);
    } else {
      toast.success('Todas as funções estão deployadas!');
    }
  };

  const copyReport = () => {
    if (!results) return;
    
    const report = `
╔═══════════════════════════════════════════════════════════════╗
║        VERIFICAÇÃO DE DEPLOYMENT - FUNÇÕES BACKEND            ║
╚═══════════════════════════════════════════════════════════════╝

📊 RESUMO:
   Total: ${results.summary.total}
   ✅ Deployed: ${results.summary.deployed}
   ❌ Not Deployed: ${results.summary.notDeployed}
   Score: ${results.summary.score}/100

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 DETALHES:

${results.checks.map(c => `
${c.status === 'deployed' ? '✅' : '❌'} ${c.name} (${c.category})
   Status: ${c.status === 'deployed' ? 'DEPLOYED' : 'NOT DEPLOYED'}
   Tempo: ${c.timeMs}ms
   ${c.error ? `Erro: ${c.error}` : ''}
`).join('')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${results.summary.notDeployed > 0 ? `
⚠️  AÇÃO NECESSÁRIA:

1. Acesse: Base44 Dashboard → Code → Functions
2. Para cada função não deployada:
   - Abra o arquivo da função no editor
   - Faça uma pequena alteração (adicione um espaço ou comentário)
   - Salve o arquivo (Ctrl+S ou Cmd+S)
   - Aguarde o deploy automático (5-10 segundos)
3. Execute este verificador novamente
4. Quando todas estiverem ✅, o sistema estará pronto

Funções não deployadas:
${results.checks.filter(c => c.status === 'not_deployed').map(c => `• ${c.name}`).join('\n')}
` : `
✅ TODAS AS FUNÇÕES ESTÃO DEPLOYADAS

O sistema está pronto para uso. Próximos passos:
1. Configurar variáveis EFI (se ainda não configurado)
2. Testar fluxo completo em homologação
3. Deploy em produção
`}

Gerado em: ${new Date().toLocaleString('pt-BR')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `.trim();
    
    navigator.clipboard.writeText(report);
    toast.success('Relatório de deployment copiado!');
  };

  return (
    <GlowCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-1">Verificador de Deployment</h3>
          <p className="text-sm text-[#A9B2C7]">Verifica se todas as funções críticas estão deployadas</p>
        </div>
        <GradientButton onClick={runDeploymentCheck} disabled={testing} className="flex items-center gap-2">
          <Play className={`w-5 h-5 ${testing ? 'animate-pulse' : ''}`} />
          {testing ? 'Verificando...' : 'Verificar Deployment'}
        </GradientButton>
      </div>

      {results && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#05070B] rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-[#19E0FF] mb-1">{results.summary.deployed}</p>
              <p className="text-xs text-[#A9B2C7]">Deployed</p>
            </div>
            <div className="bg-[#05070B] rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-[#FF4B6A] mb-1">{results.summary.notDeployed}</p>
              <p className="text-xs text-[#A9B2C7]">Not Deployed</p>
            </div>
            <div className="bg-[#05070B] rounded-lg p-4 text-center">
              <p className={`text-3xl font-bold mb-1 ${
                results.summary.score >= 90 ? 'text-[#10B981]' :
                results.summary.score >= 70 ? 'text-[#F7CE46]' :
                'text-[#FF4B6A]'
              }`}>
                {results.summary.score}
              </p>
              <p className="text-xs text-[#A9B2C7]">Score</p>
            </div>
          </div>

          {/* Detailed Results */}
          <div className="space-y-2">
            {results.checks.map((check, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-[#05070B] rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  {check.status === 'deployed' ? (
                    <CheckCircle className="w-5 h-5 text-[#10B981] flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-[#FF4B6A] flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-white font-mono text-sm">{check.name}</p>
                    {check.error && check.status === 'not_deployed' && (
                      <p className="text-xs text-[#FF4B6A]">Função não deployada</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-[#A9B2C7]">{check.category}</span>
                  <span className="text-xs text-[#A9B2C7]">{check.timeMs}ms</span>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <GradientButton onClick={copyReport} variant="secondary" className="flex items-center gap-2">
              <Copy className="w-4 h-4" />
              Copiar Relatório
            </GradientButton>
          </div>

          {/* Warning if not deployed */}
          {results.summary.notDeployed > 0 && (
            <div className="p-4 bg-[#FF4B6A]/10 border border-[#FF4B6A]/30 rounded-lg">
              <p className="text-white font-semibold mb-2">⚠️ Funções não deployadas detectadas</p>
              <p className="text-sm text-[#A9B2C7] mb-3">
                Para deployar manualmente:
              </p>
              <ol className="text-sm text-[#A9B2C7] space-y-1 list-decimal list-inside">
                <li>Acesse Base44 Dashboard → Code → Functions</li>
                <li>Abra cada função não deployada no editor</li>
                <li>Adicione um comentário ou espaço</li>
                <li>Salve (Ctrl+S) e aguarde deploy automático (~10s)</li>
                <li>Execute este verificador novamente</li>
              </ol>
            </div>
          )}
        </div>
      )}

      {!results && (
        <div className="text-center py-12">
          <p className="text-[#A9B2C7] mb-4">Clique no botão acima para verificar o deployment</p>
          <p className="text-xs text-[#A9B2C7]">
            Isso testará se todas as funções críticas estão acessíveis
          </p>
        </div>
      )}
    </GlowCard>
  );
}