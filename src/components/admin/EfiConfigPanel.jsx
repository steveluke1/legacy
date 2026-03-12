import React, { useState } from 'react';
import { Settings, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import GradientButton from '@/components/ui/GradientButton';
import GlowCard from '@/components/ui/GlowCard';
import { toast } from 'sonner';

export default function EfiConfigPanel({ adminToken }) {
  const [appUrl, setAppUrl] = useState('');
  const [allowSkipMtls, setAllowSkipMtls] = useState(false);

  const configureWebhookMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('admin_configureEfiWebhook', {
        adminToken,
        app_url: appUrl,
        allow_skip_mtls: allowSkipMtls
      });
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Webhook EFI configurado com sucesso!');
      } else {
        toast.error(data.error || 'Erro ao configurar webhook');
      }
    },
    onError: (error) => {
      toast.error('Erro ao configurar webhook: ' + error.message);
    }
  });

  const handleConfigure = () => {
    if (!appUrl) {
      toast.error('Digite a URL do app');
      return;
    }
    configureWebhookMutation.mutate();
  };

  return (
    <GlowCard className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-[#19E0FF]/20 rounded-lg flex items-center justify-center">
          <Settings className="w-6 h-6 text-[#19E0FF]" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Configuração EFI PIX</h3>
          <p className="text-sm text-[#A9B2C7]">Configure webhook e integração PIX</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-[#F7CE46]/10 border border-[#F7CE46]/30 rounded-lg">
          <p className="text-sm text-[#F7CE46] mb-2 font-semibold">
            ⚠️ Variáveis de Ambiente Necessárias:
          </p>
          <ul className="text-xs text-[#A9B2C7] space-y-1 list-disc list-inside">
            <li>EFI_CLIENT_ID</li>
            <li>EFI_CLIENT_SECRET</li>
            <li>EFI_CERT_PEM_B64 (certificado em base64)</li>
            <li>EFI_KEY_PEM_B64 (chave privada em base64)</li>
            <li>EFI_PIX_KEY (sua chave PIX)</li>
            <li>EFI_ENV (homolog ou prod)</li>
          </ul>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#A9B2C7] mb-2">
            URL do App
          </label>
          <Input
            type="text"
            value={appUrl}
            onChange={(e) => setAppUrl(e.target.value)}
            placeholder="https://meuapp.com"
            className="bg-[#05070B] border-[#19E0FF]/20 text-white"
          />
          <p className="text-xs text-[#A9B2C7] mt-1">
            URL base da aplicação (será usado: {appUrl}/api/efi_pixWebhook)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={allowSkipMtls}
            onChange={(e) => setAllowSkipMtls(e.target.checked)}
            className="w-4 h-4"
          />
          <label className="text-sm text-[#A9B2C7]">
            Skip mTLS checking (apenas dev/teste)
          </label>
        </div>

        <GradientButton
          onClick={handleConfigure}
          disabled={configureWebhookMutation.isPending || !appUrl}
          loading={configureWebhookMutation.isPending}
          className="w-full"
        >
          Configurar Webhook EFI
        </GradientButton>

        <a
          href="https://dev.efipay.com.br/docs/api-pix/webhooks"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-[#19E0FF] hover:underline"
        >
          <ExternalLink className="w-4 h-4" />
          Documentação EFI Webhooks
        </a>
      </div>
    </GlowCard>
  );
}