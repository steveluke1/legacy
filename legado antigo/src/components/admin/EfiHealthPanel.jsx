import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Copy, Server, Key, Shield, Zap } from 'lucide-react';
import GlowCard from '@/components/ui/GlowCard';
import GradientButton from '@/components/ui/GradientButton';
import { toast } from 'sonner';

export default function EfiHealthPanel() {
  const [testing, setTesting] = useState(false);

  const { data: health, isLoading, refetch } = useQuery({
    queryKey: ['efi-health'],
    queryFn: async () => {
      const response = await base44.functions.invoke('efi_healthCheck', {});
      return response.data;
    },
    staleTime: 10000,
    refetchOnWindowFocus: false
  });

  const handleTest = async () => {
    setTesting(true);
    try {
      await refetch();
      toast.success('Verificação concluída');
    } catch (error) {
      toast.error('Erro na verificação: ' + error.message);
    } finally {
      setTesting(false);
    }
  };

  const copyEnvGuide = () => {
    const guide = `
╔═══════════════════════════════════════════════════════════════╗
║   GUIA DE CONFIGURAÇÃO - EFI PIX (Homologação e Produção)    ║
╚═══════════════════════════════════════════════════════════════╝

📍 ONDE CONFIGURAR:
   Base44 Dashboard → Settings → Environment Variables

⚠️  NUNCA cole secrets no código ou no chat. Use APENAS variáveis de ambiente.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧 VARIÁVEIS OBRIGATÓRIAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. EFI_ENV
   Valor: homolog OU production
   Exemplo: homolog

2. EFI_CLIENT_ID
   Onde obter: Portal EFI → Aplicações → Sua aplicação → Client ID
   Exemplo: Client_Id_abc123xyz...

3. EFI_CLIENT_SECRET
   Onde obter: Portal EFI → Aplicações → Sua aplicação → Client Secret
   Exemplo: Client_Secret_def456uvw...

4. EFI_CERT_PEM_B64
   Como obter:
   a) Baixe o certificado .pem do portal EFI
   b) Converta para Base64: 
      Linux/Mac: base64 -w 0 certificado.pem
      Windows: certutil -encode certificado.pem temp.txt && findstr /v CERTIFICATE temp.txt
   c) Cole o resultado (string longa sem quebras de linha)

5. EFI_KEY_PEM_B64
   Como obter:
   a) Baixe a chave privada .pem do portal EFI
   b) Converta para Base64 (mesmo processo do certificado)
   c) Cole o resultado

6. EFI_PIX_KEY
   Valor: Sua chave PIX da conta EFI que receberá os pagamentos
   Exemplo: contato@seudominio.com.br ou CPF/CNPJ

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛡️  VARIÁVEIS OPCIONAIS (Recomendadas)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

7. EFI_WEBHOOK_PATH
   Valor: /api/efi_pixWebhook
   (Já é o padrão, só mude se necessário)

8. EFI_WEBHOOK_SHARED_SECRET
   Gere um token aleatório forte:
   Linux/Mac: openssl rand -hex 32
   Windows: PowerShell -Command "[guid]::NewGuid().ToString('N')"
   Use o mesmo token ao configurar o webhook no portal EFI

9. EFI_WEBHOOK_IP_ALLOWLIST
   IPs da EFI separados por vírgula (opcional):
   Exemplo: 200.201.202.203,200.201.202.204

10. EFI_DEBUG
    Valor: 0 (produção) ou 1 (debug verbose)
    Padrão: 0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 CHECKLIST DE CONFIGURAÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Homologação (Testes):
□ EFI_ENV = homolog
□ Credenciais de SANDBOX do portal EFI
□ Certificado de SANDBOX convertido para base64
□ Chave PIX de teste configurada

Produção:
□ EFI_ENV = production
□ Credenciais de PRODUÇÃO do portal EFI
□ Certificado de PRODUÇÃO convertido para base64
□ Chave PIX real da conta EFI
□ Webhook configurado no portal EFI apontando para:
  https://seudominio/api/efi_pixWebhook
□ Shared secret configurado no webhook

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 COMO TESTAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Configure todas as variáveis de ambiente
2. Acesse: AdminDashboard → 🎛️ EFI Config
3. Clique em "Verificar Configuração Agora"
4. Verifique se todos os checks estão verdes:
   ✅ Variáveis de ambiente configuradas
   ✅ Autenticação OAuth funcionando
   ✅ Cliente mTLS criado com sucesso
5. Teste uma compra pequena (R$ 0,50) em homologação
6. Confirme que o webhook recebe a notificação

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  SEGURANÇA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• NUNCA commite secrets no código
• NUNCA exponha secrets em logs ou respostas de API
• Se secrets vazaram: ROTACIONE IMEDIATAMENTE no portal EFI
• Use shared secret no webhook para autenticação
• Ative IP allowlist se possível
• Mantenha EFI_DEBUG = 0 em produção

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📞 SUPORTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Documentação EFI: https://dev.efipay.com.br/docs
Portal EFI: https://sejaefi.com.br/
Suporte Base44: dashboard → Help
    `;
    navigator.clipboard.writeText(guide.trim());
    toast.success('Guia copiado! Cole em um arquivo .txt');
  };

  if (isLoading) {
    return (
      <GlowCard className="p-6">
        <div className="flex items-center gap-3 justify-center py-8">
          <RefreshCw className="w-6 h-6 text-[#19E0FF] animate-spin" />
          <span className="text-white font-semibold">Verificando configuração EFI...</span>
        </div>
      </GlowCard>
    );
  }

  const getStatusIcon = (status) => {
    if (status === true) return <CheckCircle className="w-5 h-5 text-[#10B981]" />;
    if (status === false) return <XCircle className="w-5 h-5 text-[#FF4B6A]" />;
    return <AlertTriangle className="w-5 h-5 text-[#F7CE46]" />;
  };

  const getStatusColor = (status) => {
    if (status === true) return 'text-[#10B981]';
    if (status === false) return 'text-[#FF4B6A]';
    return 'text-[#F7CE46]';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <GlowCard className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Configuração EFI PIX</h2>
            <p className="text-[#A9B2C7]">
              Ambiente: <span className={`font-semibold ${health?.env === 'production' ? 'text-[#FF4B6A]' : 'text-[#19E0FF]'}`}>
                {health?.env === 'production' ? '🔴 PRODUÇÃO' : '🟡 Homologação'}
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <GradientButton onClick={copyEnvGuide} variant="secondary" size="sm" className="flex items-center gap-2">
              <Copy className="w-4 h-4" />
              Guia de Config
            </GradientButton>
            <GradientButton onClick={handleTest} disabled={testing} size="sm" className="flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
              Verificar Agora
            </GradientButton>
          </div>
        </div>
      </GlowCard>

      {/* Status Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <GlowCard className={`p-6 ${health?.configured ? 'border-[#10B981]/30' : 'border-[#FF4B6A]/30'}`}>
          <div className="flex items-center gap-3 mb-3">
            <Key className="w-6 h-6 text-[#19E0FF]" />
            <h3 className="text-lg font-semibold text-white">Variáveis de Ambiente</h3>
          </div>
          <p className={`text-2xl font-bold mb-2 ${getStatusColor(health?.configured)}`}>
            {health?.configured ? 'Configurado' : 'Incompleto'}
          </p>
          {health?.missingVars && health.missingVars.length > 0 && (
            <div className="text-sm text-[#FF4B6A] space-y-1">
              <p className="font-semibold">Faltando:</p>
              {health.missingVars.map(v => (
                <p key={v}>• {v}</p>
              ))}
            </div>
          )}
        </GlowCard>

        <GlowCard className={`p-6 ${health?.checks?.oauth ? 'border-[#10B981]/30' : 'border-[#FF4B6A]/30'}`}>
          <div className="flex items-center gap-3 mb-3">
            <Shield className="w-6 h-6 text-[#19E0FF]" />
            <h3 className="text-lg font-semibold text-white">Autenticação OAuth</h3>
          </div>
          <p className={`text-2xl font-bold mb-2 ${getStatusColor(health?.checks?.oauth)}`}>
            {health?.checks?.oauth ? 'Funcionando' : 'Falhou'}
          </p>
          {health?.oauthError && (
            <p className="text-xs text-[#FF4B6A]">{health.oauthError}</p>
          )}
        </GlowCard>

        <GlowCard className={`p-6 ${health?.checks?.mTLS ? 'border-[#10B981]/30' : 'border-[#FF4B6A]/30'}`}>
          <div className="flex items-center gap-3 mb-3">
            <Server className="w-6 h-6 text-[#19E0FF]" />
            <h3 className="text-lg font-semibold text-white">Cliente mTLS</h3>
          </div>
          <p className={`text-2xl font-bold ${getStatusColor(health?.checks?.mTLS)}`}>
            {health?.checks?.mTLS ? 'OK' : 'Erro'}
          </p>
        </GlowCard>
      </div>

      {/* Detailed Info */}
      <GlowCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#19E0FF]" />
          Detalhes da Configuração
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[#A9B2C7] mb-1">URL Base:</p>
            <p className="text-white font-mono text-xs">{health?.baseUrl}</p>
          </div>
          <div>
            <p className="text-[#A9B2C7] mb-1">Webhook Path:</p>
            <p className="text-white font-mono text-xs">{health?.webhookPath}</p>
          </div>
          <div>
            <p className="text-[#A9B2C7] mb-1">Client ID:</p>
            <p className="text-white font-mono text-xs">{health?.credentials?.clientId || 'Não configurado'}</p>
          </div>
          <div>
            <p className="text-[#A9B2C7] mb-1">Chave PIX:</p>
            <p className="text-white font-mono text-xs">{health?.credentials?.pixKey || 'Não configurado'}</p>
          </div>
          <div>
            <p className="text-[#A9B2C7] mb-1">Webhook Secured:</p>
            <p className={getStatusColor(health?.webhookSecured)}>
              {health?.webhookSecured ? 'Sim (shared secret)' : 'Não (considere adicionar)'}
            </p>
          </div>
          <div>
            <p className="text-[#A9B2C7] mb-1">IP Filtering:</p>
            <p className={getStatusColor(health?.webhookIpFilterEnabled)}>
              {health?.webhookIpFilterEnabled ? 'Ativo' : 'Desativado'}
            </p>
          </div>
        </div>
      </GlowCard>

      {/* Function Deployment Status */}
      {health?.functions && (
        <GlowCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Status de Deploy das Funções</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {Object.entries(health.functions).map(([name, status]) => (
              <div key={name} className="flex items-center justify-between p-3 bg-[#05070B] rounded-lg">
                <span className="text-sm text-white font-mono">{name}</span>
                {status === 'deployed' ? (
                  <span className="flex items-center gap-1 text-[#10B981] text-xs">
                    <CheckCircle className="w-4 h-4" />
                    Deployed
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[#FF4B6A] text-xs">
                    <XCircle className="w-4 h-4" />
                    Not Deployed
                  </span>
                )}
              </div>
            ))}
          </div>
        </GlowCard>
      )}

      {/* Decision */}
      {health && (
        <GlowCard className={`p-6 ${health.configured && health.checks?.oauth ? 'bg-[#10B981]/10 border-[#10B981]/30' : 'bg-[#FF4B6A]/10 border-[#FF4B6A]/30'}`}>
          <h3 className="text-xl font-bold text-white mb-3">Decisão Final</h3>
          {health.configured && health.checks?.oauth ? (
            <div>
              <p className="text-[#10B981] text-lg font-semibold mb-2">✅ PRONTO PARA USO</p>
              <p className="text-[#A9B2C7] text-sm">
                A integração EFI está configurada e funcional. Você pode realizar cobranças PIX em ambiente de {health.env}.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-[#FF4B6A] text-lg font-semibold mb-2">❌ CONFIGURAÇÃO INCOMPLETA</p>
              <p className="text-[#A9B2C7] text-sm mb-3">
                Complete a configuração das variáveis de ambiente antes de usar o sistema PIX.
              </p>
              <GradientButton onClick={copyEnvGuide} size="sm" className="flex items-center gap-2">
                <Copy className="w-4 h-4" />
                Copiar Guia Completo
              </GradientButton>
            </div>
          )}
        </GlowCard>
      )}
    </div>
  );
}