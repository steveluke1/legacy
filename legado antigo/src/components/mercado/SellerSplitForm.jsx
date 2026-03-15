import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function SellerSplitForm({ profile, onUpdate }) {
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    efi_split_account: profile?.efi_split_account || '',
    efi_split_document: profile?.efi_split_document || ''
  });
  const [saving, setSaving] = useState(false);

  const formatDocument = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    
    // CPF: 000.000.000-00
    if (digits.length <= 11) {
      return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    
    // CNPJ: 00.000.000/0000-00
    return digits
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  };

  const handleDocumentChange = (e) => {
    const formatted = formatDocument(e.target.value);
    setFormData({ ...formData, efi_split_document: formatted });
  };

  const validateForm = () => {
    const digits = formData.efi_split_document.replace(/\D/g, '');
    
    if (!formData.full_name || formData.full_name.trim().length < 3) {
      toast.error('Nome completo é obrigatório (mínimo 3 caracteres)');
      return false;
    }
    
    if (!formData.efi_split_account || formData.efi_split_account.trim().length === 0) {
      toast.error('Número da conta Efí é obrigatório');
      return false;
    }
    
    if (digits.length !== 11 && digits.length !== 14) {
      toast.error('CPF deve ter 11 dígitos ou CNPJ 14 dígitos');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSaving(true);
    
    try {
      const digitsOnly = formData.efi_split_document.replace(/\D/g, '');
      
      await onUpdate({
        full_name: formData.full_name.trim(),
        efi_split_account: formData.efi_split_account.trim(),
        efi_split_document: digitsOnly
      });
      
      toast.success('Dados do Split salvos. Você já pode vender no marketplace.');
    } catch (error) {
      // Handle 401 specifically
      if (error.response?.status === 401 || error.message?.includes('401')) {
        toast.error('Sessão expirada. Faça login novamente.');
      } else {
        toast.error(error.message || 'Erro ao salvar');
      }
    } finally {
      setSaving(false);
    }
  };

  // Normalize status client-side (defensive: pending → verified, unknown → missing)
  const rawStatus = profile?.efi_split_status;
  const normalizedStatus = rawStatus === 'pending' ? 'verified' : (rawStatus || 'missing');
  
  const statusConfig = {
    missing: {
      icon: AlertCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      text: 'Configuração Efí Split pendente'
    },
    verified: {
      icon: CheckCircle2,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      text: 'Split configurado e pronto para uso'
    }
  };

  // Safe fallback for unknown statuses
  const config = statusConfig[normalizedStatus] ?? statusConfig.missing;
  const StatusIcon = config.icon;

  return (
    <div className="space-y-6">
      {/* Status banner */}
      <div className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
        <div className="flex items-start gap-3">
          <StatusIcon className={`w-5 h-5 mt-0.5 ${config.color}`} />
          <div className="flex-1">
            <p className={`font-medium ${config.color}`}>
              {config.text}
            </p>
            {normalizedStatus === 'missing' && (
              <p className="text-sm text-[#A9B2C7] mt-1">
                Para vender ALZ, você precisa cadastrar seus dados Efí Split abaixo.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Info box */}
      <div className="p-4 bg-[#19E0FF]/10 border border-[#19E0FF]/30 rounded-lg">
        <h3 className="font-bold text-white mb-2">📋 O que é Efí Split?</h3>
        <p className="text-[#A9B2C7] text-sm mb-3">
          O Split de pagamento permite que você receba diretamente na sua conta Efí quando alguém compra seu ALZ. 
          A divisão é automática e instantânea após a confirmação do PIX.
        </p>
        <h4 className="font-semibold text-white text-sm mb-2">Requisitos:</h4>
        <ul className="text-[#A9B2C7] text-sm space-y-1 list-disc list-inside">
          <li>Conta digital Efí ativa (criar em <a href="https://sejaefi.com.br" target="_blank" rel="noopener" className="text-[#19E0FF] hover:underline inline-flex items-center gap-1">sejaefi.com.br <ExternalLink className="w-3 h-3" /></a>)</li>
          <li>CPF ou CNPJ cadastrado na conta Efí</li>
          <li>Número da sua conta Efí (encontrado no app/painel)</li>
        </ul>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="full_name" className="text-white">Nome Completo</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            placeholder="Seu nome completo (conforme Efí)"
            className="bg-[#0C121C] border-[#19E0FF]/30 text-white"
          />
          <p className="text-xs text-[#A9B2C7] mt-1">
            Deve ser idêntico ao nome cadastrado na sua conta Efí
          </p>
        </div>

        <div>
          <Label htmlFor="efi_split_document" className="text-white">CPF ou CNPJ</Label>
          <Input
            id="efi_split_document"
            value={formData.efi_split_document}
            onChange={handleDocumentChange}
            placeholder="000.000.000-00 ou 00.000.000/0000-00"
            className="bg-[#0C121C] border-[#19E0FF]/30 text-white"
            maxLength={18}
          />
          <p className="text-xs text-[#A9B2C7] mt-1">
            Documento cadastrado na conta Efí (11 ou 14 dígitos)
          </p>
        </div>

        <div>
          <Label htmlFor="efi_split_account" className="text-white">Número da Conta Efí</Label>
          <Input
            id="efi_split_account"
            value={formData.efi_split_account}
            onChange={(e) => setFormData({ ...formData, efi_split_account: e.target.value })}
            placeholder="1234567"
            className="bg-[#0C121C] border-[#19E0FF]/30 text-white"
          />
          <p className="text-xs text-[#A9B2C7] mt-1">
            Número da sua conta digital Efí (encontrado no app/painel Efí)
          </p>
        </div>

        <Button
          type="submit"
          disabled={saving}
          className="w-full bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] hover:opacity-90"
        >
          {saving ? 'Salvando...' : 'Salvar Dados Split'}
        </Button>
      </form>
    </div>
  );
}