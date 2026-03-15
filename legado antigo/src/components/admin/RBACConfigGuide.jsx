import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Copy, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlowCard from '@/components/ui/GlowCard';
import { toast } from 'sonner';

const rbacConfig = {
  critical: [
    {
      entity: 'AdminUser',
      rule: 'Admin-only (Read/Write)',
      risk: 'CRÍTICO',
      reason: 'Credenciais de admin expostas publicamente',
      steps: [
        '1. Ir para Dashboard Base44 → Entities → AdminUser',
        '2. Clicar em "Access Rules"',
        '3. Configurar: "Admins can read/write, Users cannot access"',
        '4. Salvar configuração'
      ]
    },
    {
      entity: 'AdminSession',
      rule: 'Admin-only (Read/Write)',
      risk: 'CRÍTICO',
      reason: 'Tokens de sessão admin expostos',
      steps: [
        '1. Ir para Dashboard Base44 → Entities → AdminSession',
        '2. Clicar em "Access Rules"',
        '3. Configurar: "Admins can read/write, Users cannot access"',
        '4. Salvar configuração'
      ]
    },
    {
      entity: 'CashLedger',
      rule: 'Admin-only (Read/Write)',
      risk: 'CRÍTICO',
      reason: 'Histórico de transações CASH visível publicamente',
      steps: [
        '1. Ir para Dashboard Base44 → Entities → CashLedger',
        '2. Clicar em "Access Rules"',
        '3. Configurar: "Admins can read/write, Users cannot access"',
        '4. Salvar configuração'
      ]
    },
    {
      entity: 'PaymentTransaction',
      rule: 'Admin-only (Read/Write)',
      risk: 'CRÍTICO',
      reason: 'Dados de pagamento PIX/cartão expostos',
      steps: [
        '1. Ir para Dashboard Base44 → Entities → PaymentTransaction',
        '2. Clicar em "Access Rules"',
        '3. Configurar: "Admins can read/write, Users cannot access"',
        '4. Salvar configuração'
      ]
    },
    {
      entity: 'AnalyticsEvent',
      rule: 'Admin-only (Read/Write)',
      risk: 'CRÍTICO',
      reason: 'Eventos de analytics com IPs e dados sensíveis',
      steps: [
        '1. Ir para Dashboard Base44 → Entities → AnalyticsEvent',
        '2. Clicar em "Access Rules"',
        '3. Configurar: "Admins can read/write, Users cannot access"',
        '4. Salvar configuração'
      ]
    },
    {
      entity: 'CommerceEvent',
      rule: 'Admin-only (Read/Write)',
      risk: 'CRÍTICO',
      reason: 'Histórico comercial completo exposto',
      steps: [
        '1. Ir para Dashboard Base44 → Entities → CommerceEvent',
        '2. Clicar em "Access Rules"',
        '3. Configurar: "Admins can read/write, Users cannot access"',
        '4. Salvar configuração'
      ]
    }
  ],
  high: [
    {
      entity: 'StoreOrder',
      rule: 'Admin (all), User (own only)',
      risk: 'ALTO',
      reason: 'Pedidos de loja visíveis para todos',
      steps: [
        '1. Ir para Dashboard Base44 → Entities → StoreOrder',
        '2. Clicar em "Access Rules"',
        '3. Configurar: "Admins can read/write all, Users can read/write where buyer_user_id = currentUser.id"',
        '4. Salvar configuração'
      ]
    },
    {
      entity: 'GameAccount',
      rule: 'User (own only), Admin (all)',
      risk: 'ALTO',
      reason: 'Saldos CASH/ALZ de todas contas expostos',
      steps: [
        '1. Ir para Dashboard Base44 → Entities → GameAccount',
        '2. Clicar em "Access Rules"',
        '3. Configurar: "Users can read/write where user_id = currentUser.id, Admins can read/write all"',
        '4. Salvar configuração'
      ]
    },
    {
      entity: 'UserAccount',
      rule: 'User (own only), Admin (all)',
      risk: 'ALTO',
      reason: 'Dados de conta do portal expostos',
      steps: [
        '1. Ir para Dashboard Base44 → Entities → UserAccount',
        '2. Clicar em "Access Rules"',
        '3. Configurar: "Users can read/write where user_id = currentUser.id, Admins can read/write all"',
        '4. Salvar configuração'
      ]
    }
  ],
  medium: [
    {
      entity: 'AlzSellOrder',
      rule: 'Public (read active), User (own), Admin (all)',
      risk: 'MÉDIO',
      reason: 'Ordens de venda ALZ devem ser públicas para marketplace',
      steps: [
        '1. Ir para Dashboard Base44 → Entities → AlzSellOrder',
        '2. Clicar em "Access Rules"',
        '3. Configurar: "Public can read where status=active, Users can write where seller_user_id = currentUser.id, Admins can read/write all"',
        '4. Salvar configuração'
      ]
    },
    {
      entity: 'MarketOrder',
      rule: 'Involved parties + Admin',
      risk: 'MÉDIO',
      reason: 'Pedidos do mercado devem ser visíveis apenas para envolvidos',
      steps: [
        '1. Ir para Dashboard Base44 → Entities → MarketOrder',
        '2. Clicar em "Access Rules"',
        '3. Configurar: "Users can read/write where buyer_user_id = currentUser.id OR seller_user_id = currentUser.id, Admins can read/write all"',
        '4. Salvar configuração'
      ]
    }
  ]
};

export default function RBACConfigGuide() {
  const [copiedEntity, setCopiedEntity] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});

  const copySteps = (entity) => {
    const config = [...rbacConfig.critical, ...rbacConfig.high, ...rbacConfig.medium].find(c => c.entity === entity);
    if (!config) return;

    const text = `
CONFIGURAÇÃO RBAC - ${entity}

Regra: ${config.rule}
Risco: ${config.risk}
Motivo: ${config.reason}

PASSOS:
${config.steps.join('\n')}
`;

    navigator.clipboard.writeText(text);
    setCopiedEntity(entity);
    toast.success(`Instruções para ${entity} copiadas!`);
    setTimeout(() => setCopiedEntity(null), 2000);
  };

  const toggleCheck = (entity) => {
    setCheckedItems(prev => ({
      ...prev,
      [entity]: !prev[entity]
    }));
  };

  const totalItems = rbacConfig.critical.length + rbacConfig.high.length + rbacConfig.medium.length;
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const progress = Math.round((checkedCount / totalItems) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Guia de Configuração RBAC</h2>
          <p className="text-[#A9B2C7] text-sm mt-1">
            Siga este checklist para configurar regras de acesso no dashboard Base44
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-[#19E0FF]">{progress}%</div>
          <div className="text-xs text-[#A9B2C7]">{checkedCount}/{totalItems} concluídos</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-3 bg-[#0C121C] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className="h-full bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8]"
        />
      </div>

      {/* Critical Priority */}
      <GlowCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-[#FF4B6A]/20 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-[#FF4B6A]" />
          </div>
          <h3 className="text-xl font-bold text-white">
            ⛔ Prioridade CRÍTICA ({rbacConfig.critical.length} entidades)
          </h3>
        </div>
        <p className="text-[#A9B2C7] text-sm mb-6">
          Estas entidades DEVEM ser configuradas antes de qualquer deploy em produção.
        </p>
        <div className="space-y-4">
          {rbacConfig.critical.map((config, i) => (
            <motion.div
              key={config.entity}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 bg-[#05070B] border border-[#FF4B6A]/30 rounded-lg"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleCheck(config.entity)}
                    className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      checkedItems[config.entity]
                        ? 'bg-[#10B981] border-[#10B981]'
                        : 'border-[#A9B2C7] hover:border-[#19E0FF]'
                    }`}
                  >
                    {checkedItems[config.entity] && <CheckCircle className="w-4 h-4 text-white" />}
                  </button>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-bold">{config.entity}</p>
                      <span className="px-2 py-0.5 bg-[#FF4B6A]/20 text-[#FF4B6A] text-xs rounded font-bold">
                        {config.risk}
                      </span>
                    </div>
                    <p className="text-[#A9B2C7] text-sm mb-2">{config.reason}</p>
                    <p className="text-[#19E0FF] text-xs font-semibold">→ {config.rule}</p>
                  </div>
                </div>
                <Button
                  onClick={() => copySteps(config.entity)}
                  variant="ghost"
                  size="sm"
                  className="text-[#19E0FF] hover:bg-[#19E0FF]/10"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              {copiedEntity === config.entity && (
                <p className="text-[#10B981] text-xs mt-2">✓ Instruções copiadas!</p>
              )}
            </motion.div>
          ))}
        </div>
      </GlowCard>

      {/* High Priority */}
      <GlowCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-[#F7CE46]/20 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#F7CE46]" />
          </div>
          <h3 className="text-xl font-bold text-white">
            🟡 Prioridade ALTA ({rbacConfig.high.length} entidades)
          </h3>
        </div>
        <p className="text-[#A9B2C7] text-sm mb-6">
          Configure logo após os itens críticos.
        </p>
        <div className="space-y-4">
          {rbacConfig.high.map((config, i) => (
            <motion.div
              key={config.entity}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 bg-[#05070B] border border-[#F7CE46]/30 rounded-lg"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleCheck(config.entity)}
                    className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      checkedItems[config.entity]
                        ? 'bg-[#10B981] border-[#10B981]'
                        : 'border-[#A9B2C7] hover:border-[#19E0FF]'
                    }`}
                  >
                    {checkedItems[config.entity] && <CheckCircle className="w-4 h-4 text-white" />}
                  </button>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-bold">{config.entity}</p>
                      <span className="px-2 py-0.5 bg-[#F7CE46]/20 text-[#F7CE46] text-xs rounded font-bold">
                        {config.risk}
                      </span>
                    </div>
                    <p className="text-[#A9B2C7] text-sm mb-2">{config.reason}</p>
                    <p className="text-[#19E0FF] text-xs font-semibold">→ {config.rule}</p>
                  </div>
                </div>
                <Button
                  onClick={() => copySteps(config.entity)}
                  variant="ghost"
                  size="sm"
                  className="text-[#19E0FF] hover:bg-[#19E0FF]/10"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </GlowCard>

      {/* Medium Priority */}
      <GlowCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-[#19E0FF]/20 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#19E0FF]" />
          </div>
          <h3 className="text-xl font-bold text-white">
            🟢 Prioridade MÉDIA ({rbacConfig.medium.length} entidades)
          </h3>
        </div>
        <p className="text-[#A9B2C7] text-sm mb-6">
          Configure após sistema estabilizado.
        </p>
        <div className="space-y-4">
          {rbacConfig.medium.map((config, i) => (
            <motion.div
              key={config.entity}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 bg-[#05070B] border border-[#19E0FF]/30 rounded-lg"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleCheck(config.entity)}
                    className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      checkedItems[config.entity]
                        ? 'bg-[#10B981] border-[#10B981]'
                        : 'border-[#A9B2C7] hover:border-[#19E0FF]'
                    }`}
                  >
                    {checkedItems[config.entity] && <CheckCircle className="w-4 h-4 text-white" />}
                  </button>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-bold">{config.entity}</p>
                      <span className="px-2 py-0.5 bg-[#19E0FF]/20 text-[#19E0FF] text-xs rounded font-bold">
                        {config.risk}
                      </span>
                    </div>
                    <p className="text-[#A9B2C7] text-sm mb-2">{config.reason}</p>
                    <p className="text-[#19E0FF] text-xs font-semibold">→ {config.rule}</p>
                  </div>
                </div>
                <Button
                  onClick={() => copySteps(config.entity)}
                  variant="ghost"
                  size="sm"
                  className="text-[#19E0FF] hover:bg-[#19E0FF]/10"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </GlowCard>

      {/* Summary */}
      <GlowCard className="p-6">
        <h3 className="text-lg font-bold text-white mb-4">Resumo do Progresso</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#FF4B6A]/10 border border-[#FF4B6A]/30 rounded-lg text-center">
            <p className="text-3xl font-bold text-[#FF4B6A]">
              {rbacConfig.critical.filter(c => checkedItems[c.entity]).length}/{rbacConfig.critical.length}
            </p>
            <p className="text-[#A9B2C7] text-sm mt-1">Críticos</p>
          </div>
          <div className="p-4 bg-[#F7CE46]/10 border border-[#F7CE46]/30 rounded-lg text-center">
            <p className="text-3xl font-bold text-[#F7CE46]">
              {rbacConfig.high.filter(c => checkedItems[c.entity]).length}/{rbacConfig.high.length}
            </p>
            <p className="text-[#A9B2C7] text-sm mt-1">Altos</p>
          </div>
          <div className="p-4 bg-[#19E0FF]/10 border border-[#19E0FF]/30 rounded-lg text-center">
            <p className="text-3xl font-bold text-[#19E0FF]">
              {rbacConfig.medium.filter(c => checkedItems[c.entity]).length}/{rbacConfig.medium.length}
            </p>
            <p className="text-[#A9B2C7] text-sm mt-1">Médios</p>
          </div>
        </div>

        {progress === 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 p-4 bg-[#10B981]/10 border border-[#10B981]/30 rounded-lg text-center"
          >
            <CheckCircle className="w-12 h-12 text-[#10B981] mx-auto mb-2" />
            <p className="text-[#10B981] font-bold">
              ✅ Todos os itens do checklist marcados como concluídos!
            </p>
            <p className="text-[#A9B2C7] text-sm mt-2">
              Execute a Varredura novamente para validar as configurações.
            </p>
          </motion.div>
        )}
      </GlowCard>
    </div>
  );
}