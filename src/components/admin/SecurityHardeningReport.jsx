import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, AlertTriangle, CheckCircle, XCircle, Copy, Database, Key, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlowCard from '@/components/ui/GlowCard';
import { toast } from 'sonner';

const RBAC_ENTITIES = [
  {
    name: 'AdminUser',
    risk: 'CRÍTICO',
    sensitivity: 'MÁXIMA',
    fields: 'password_hash, password_salt, failed_login_attempts, locked_until',
    currentAccess: 'Público (padrão)',
    requiredAccess: 'Somente Admins',
    dashboardConfig: 'Admins can read/write, Users cannot access',
    reasoning: 'Contém credenciais de administradores. Exposição permitiria roubo de contas admin.',
    blocker: true
  },
  {
    name: 'AdminSession',
    risk: 'CRÍTICO',
    sensitivity: 'MÁXIMA',
    fields: 'token_jti, expires_at, admin_user_id, ip_hash',
    currentAccess: 'Público (padrão)',
    requiredAccess: 'Somente Admins',
    dashboardConfig: 'Admins can read/write, Users cannot access',
    reasoning: 'Tokens de sessão admin. Exposição permitiria session hijacking.',
    blocker: true
  },
  {
    name: 'AuthUser',
    risk: 'CRÍTICO',
    sensitivity: 'MÁXIMA',
    fields: 'password_hash, password_salt, email, failed_login_attempts',
    currentAccess: 'Público (padrão)',
    requiredAccess: 'Own record (user_id) + Admins',
    dashboardConfig: 'Users can read/write own (where id = currentUser.id), Admins can read/write all',
    reasoning: 'Credenciais de usuários. Deve ser acessível apenas pelo próprio usuário.',
    blocker: true
  },
  {
    name: 'AuthSession',
    risk: 'CRÍTICO',
    sensitivity: 'MÁXIMA',
    fields: 'token_jti, user_id, expires_at, ip_hash',
    currentAccess: 'Público (padrão)',
    requiredAccess: 'Own sessions (user_id) + Admins',
    dashboardConfig: 'Users can read own (where user_id = currentUser.id), Admins can read/write all',
    reasoning: 'Sessões de usuários. Exposição permitiria session hijacking.',
    blocker: true
  },
  {
    name: 'CashLedger',
    risk: 'CRÍTICO',
    sensitivity: 'ALTA',
    fields: 'account_id, operation, amount, previous_balance, new_balance, reason, admin_user_id',
    currentAccess: 'Público (padrão)',
    requiredAccess: 'Somente Admins',
    dashboardConfig: 'Admins can read/write, Users cannot access',
    reasoning: 'Histórico completo de transações CASH. Contém dados financeiros sensíveis.',
    blocker: true
  },
  {
    name: 'PaymentTransaction',
    risk: 'CRÍTICO',
    sensitivity: 'ALTA',
    fields: 'provider, provider_reference, gross_amount_brl, raw_payload, pix_code',
    currentAccess: 'Público (padrão)',
    requiredAccess: 'Somente Admins',
    dashboardConfig: 'Admins can read/write, Users cannot access',
    reasoning: 'Dados de pagamento PIX/cartão. Exposição violaria PCI/LGPD.',
    blocker: true
  },
  {
    name: 'AnalyticsEvent',
    risk: 'CRÍTICO',
    sensitivity: 'MÉDIA',
    fields: 'event_type, user_id, session_id, anon_id, device, metadata, ip_hash',
    currentAccess: 'Público (padrão)',
    requiredAccess: 'Somente Admins',
    dashboardConfig: 'Admins can read/write, Users cannot access',
    reasoning: 'Analytics com IPs e dados de comportamento. Privacidade LGPD.',
    blocker: true
  },
  {
    name: 'CommerceEvent',
    risk: 'CRÍTICO',
    sensitivity: 'ALTA',
    fields: 'eventType, actorUserId, amount, amountBrl, amountCash, metadata, correlationId',
    currentAccess: 'Público (padrão)',
    requiredAccess: 'Somente Admins',
    dashboardConfig: 'Admins can read/write, Users cannot access',
    reasoning: 'Histórico comercial completo. Dados financeiros de todos usuários.',
    blocker: true
  },
  {
    name: 'StoreOrder',
    risk: 'ALTO',
    sensitivity: 'ALTA',
    fields: 'buyer_user_id, item_type, price_brl, price_cash, payment_method, status',
    currentAccess: 'Público (padrão)',
    requiredAccess: 'Own orders (buyer_user_id) + Admins',
    dashboardConfig: 'Users can read/write own (where buyer_user_id = currentUser.id), Admins can read/write all',
    reasoning: 'Pedidos de loja. Usuário deve ver apenas seus próprios pedidos.',
    blocker: false,
    priority: 'ALTA'
  },
  {
    name: 'GameAccount',
    risk: 'ALTO',
    sensitivity: 'ALTA',
    fields: 'user_id, cash_balance, cash_locked, alz_balance, alz_locked',
    currentAccess: 'Público (padrão)',
    requiredAccess: 'Own account (user_id) + Admins',
    dashboardConfig: 'Users can read/write own (where user_id = currentUser.id), Admins can read/write all',
    reasoning: 'Saldos de CASH e ALZ. Dados financeiros pessoais.',
    blocker: false,
    priority: 'ALTA'
  },
  {
    name: 'UserAccount',
    risk: 'ALTO',
    sensitivity: 'ALTA',
    fields: 'user_id, cash_balance, level, exp, crystal_fragments',
    currentAccess: 'Público (padrão)',
    requiredAccess: 'Own account (user_id) + Admins',
    dashboardConfig: 'Users can read/write own (where user_id = currentUser.id), Admins can read/write all',
    reasoning: 'Conta do portal com saldos. Dados pessoais e financeiros.',
    blocker: false,
    priority: 'ALTA'
  },
  {
    name: 'AlzPixPayment',
    risk: 'ALTO',
    sensitivity: 'ALTA',
    fields: 'buyer_user_id, total_price_brl, provider_payload, provider_reference_id',
    currentAccess: 'Público (padrão)',
    requiredAccess: 'Own payments (buyer_user_id) + Admins',
    dashboardConfig: 'Users can read own (where buyer_user_id = currentUser.id), Admins can read/write all',
    reasoning: 'Pagamentos PIX do mercado ALZ. Dados de pagamento pessoais.',
    blocker: false,
    priority: 'ALTA'
  },
  {
    name: 'AlzTrade',
    risk: 'MÉDIO',
    sensitivity: 'MÉDIA',
    fields: 'buyer_user_id, seller_user_id, alz_amount, total_price_brl',
    currentAccess: 'Público (padrão)',
    requiredAccess: 'Participantes (buyer/seller) + Admins',
    dashboardConfig: 'Users can read own trades (where buyer_user_id = currentUser.id OR seller_user_id = currentUser.id), Admins can read/write all',
    reasoning: 'Trades de ALZ. Histórico de transações entre players.',
    blocker: false,
    priority: 'MÉDIA'
  },
  {
    name: 'VipSubscription',
    risk: 'MÉDIO',
    sensitivity: 'MÉDIA',
    fields: 'user_id, plan_key, started_at, expires_at, is_active',
    currentAccess: 'Público (padrão)',
    requiredAccess: 'Own subscription (user_id) + Admins',
    dashboardConfig: 'Users can read own (where user_id = currentUser.id), Admins can read/write all',
    reasoning: 'Assinaturas VIP. Dados de compra pessoais.',
    blocker: false,
    priority: 'MÉDIA'
  }
];

export default function SecurityHardeningReport() {
  const [showPasswords, setShowPasswords] = useState(false);

  const blockers = RBAC_ENTITIES.filter(e => e.blocker);
  const highPriority = RBAC_ENTITIES.filter(e => !e.blocker && e.priority === 'ALTA');
  const mediumPriority = RBAC_ENTITIES.filter(e => !e.blocker && e.priority === 'MÉDIA');

  const totalEntities = RBAC_ENTITIES.length;
  const configuredCount = 0; // Manual tracking after dashboard config

  const copyRBACGuide = () => {
    const guide = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GUIA DE CONFIGURAÇÃO RBAC - CABAL ZIRON PORTAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Data: ${new Date().toLocaleDateString('pt-BR')}
Prioridade: CRÍTICA - Blocker para produção

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 RESUMO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Total de Entidades: ${totalEntities}
⛔ Blockers Críticos: ${blockers.length}
⚠️ Alta Prioridade: ${highPriority.length}
📋 Média Prioridade: ${mediumPriority.length}

Progresso: 0/${totalEntities} (0%)
Tempo Estimado: 45-60 minutos

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⛔ ENTIDADES CRÍTICAS (8 - BLOCKERS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${blockers.map((entity, i) => `
${i + 1}. ${entity.name}
   Risco: ${entity.risk}
   Sensibilidade: ${entity.sensitivity}
   
   Campos Sensíveis:
   ${entity.fields}
   
   Acesso Atual: ${entity.currentAccess} ⛔
   Acesso Requerido: ${entity.requiredAccess} ✅
   
   Configuração Dashboard:
   "${entity.dashboardConfig}"
   
   Justificativa:
   ${entity.reasoning}
   
   ─────────────────────────────────────────────────
`).join('')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ ENTIDADES DE ALTA PRIORIDADE (${highPriority.length})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${highPriority.map((entity, i) => `
${i + 1}. ${entity.name}
   Configuração: "${entity.dashboardConfig}"
   Justificativa: ${entity.reasoning}
`).join('')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 PASSO A PASSO - CONFIGURAÇÃO VIA DASHBOARD BASE44
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PASSO 1: Acesse o Dashboard
  → URL: https://dashboard.base44.com
  → Faça login com sua conta

PASSO 2: Navegue até Entities
  → Menu lateral esquerdo
  → Clique em "Entities"

PASSO 3: Configure CADA entidade crítica (8 obrigatórias):

${blockers.map((entity, i) => `
  [${i + 1}/${blockers.length}] ${entity.name}:
  
  1. Na lista de Entities, localize "${entity.name}"
  2. Clique no nome da entidade
  3. Clique na aba "Access Rules" (ou "Permissions")
  4. Configure:
     ${entity.dashboardConfig}
  5. Clique em "Save" ou "Apply"
  6. Aguarde confirmação visual
  7. ✅ Marque como concluído
  
`).join('')}

PASSO 4: Configure entidades de alta prioridade (${highPriority.length} recomendadas):

${highPriority.map((entity, i) => `
  [${i + 1}/${highPriority.length}] ${entity.name}:
  
  1. Localize "${entity.name}" na lista
  2. Clique na aba "Access Rules"
  3. Configure:
     ${entity.dashboardConfig}
  4. Salve as alterações
  
`).join('')}

PASSO 5: Validação

  1. Volte para o Portal CABAL ZIRON
  2. Faça login como Admin
  3. Vá para AdminDashboard → Tab "Varredura"
  4. Clique em "Iniciar Varredura"
  5. Aguarde conclusão das 7 fases
  6. Verifique seção "RBAC Status":
     - Todas as 8 entidades críticas devem mostrar ✅
     - Zero blockers detectados
  
  7. Se ainda houver blockers:
     - Revise a configuração das entidades marcadas
     - Confirme que salvou as alterações
     - Aguarde 1-2 minutos (cache do sistema)
     - Execute a varredura novamente

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ NOTAS IMPORTANTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. NUNCA remova acesso de Admins de qualquer entidade
2. Para entidades "own", sempre use o campo correto:
   - AuthUser: "where id = currentUser.id"
   - AuthSession: "where user_id = currentUser.id"
   - GameAccount: "where user_id = currentUser.id"
   - StoreOrder: "where buyer_user_id = currentUser.id"

3. Após configurar, aguarde 1-2 minutos para propagação
4. Teste acesso tanto como user quanto como admin
5. Em caso de dúvida, escolha a opção MAIS RESTRITIVA

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ VERIFICAÇÃO PÓS-CONFIGURAÇÃO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Como User (não-admin):
  ☐ Tente acessar AdminUser → Deve retornar erro 403
  ☐ Tente acessar CashLedger → Deve retornar erro 403
  ☐ Tente acessar PaymentTransaction → Deve retornar erro 403
  ☐ Acesse sua própria GameAccount → Deve funcionar ✅
  ☐ Acesse suas próprias StoreOrders → Deve funcionar ✅

Como Admin:
  ☐ Acesse AdminUser → Deve funcionar ✅
  ☐ Acesse CashLedger → Deve funcionar ✅
  ☐ Acesse PaymentTransaction → Deve funcionar ✅
  ☐ Execute AdminSystemSweep → 0 blockers ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Gerado por: Base44 AI - Security Hardening Mode
CABAL ZIRON Portal | Production Readiness
`;

    navigator.clipboard.writeText(guide);
    toast.success('Guia RBAC completo copiado!', {
      description: 'Instruções passo-a-passo em PT-BR prontas'
    });
  };

  return (
    <div className="space-y-6">
      <GlowCard className="p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-[#FF4B6A] to-[#19E0FF] rounded-xl flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white">Security Hardening Report</h2>
            <p className="text-[#A9B2C7]">Auditoria completa de RBAC e segurança</p>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-[#FF4B6A]/10 border border-[#FF4B6A]/30 rounded-lg text-center">
            <XCircle className="w-8 h-8 text-[#FF4B6A] mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#FF4B6A]">{blockers.length}</p>
            <p className="text-[#A9B2C7] text-sm">⛔ Blockers</p>
          </div>
          <div className="p-4 bg-[#F7CE46]/10 border border-[#F7CE46]/30 rounded-lg text-center">
            <AlertTriangle className="w-8 h-8 text-[#F7CE46] mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#F7CE46]">{highPriority.length}</p>
            <p className="text-[#A9B2C7] text-sm">⚠️ Alta Prioridade</p>
          </div>
          <div className="p-4 bg-[#19E0FF]/10 border border-[#19E0FF]/30 rounded-lg text-center">
            <Database className="w-8 h-8 text-[#19E0FF] mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#19E0FF]">{mediumPriority.length}</p>
            <p className="text-[#A9B2C7] text-sm">📋 Média Prioridade</p>
          </div>
          <div className="p-4 bg-[#A9B2C7]/10 border border-[#A9B2C7]/30 rounded-lg text-center">
            <CheckCircle className="w-8 h-8 text-[#A9B2C7] mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{configuredCount}/{totalEntities}</p>
            <p className="text-[#A9B2C7] text-sm">Configuradas</p>
          </div>
        </div>

        {/* Critical Blockers */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#FF4B6A]" />
            ⛔ Entidades Críticas (Blockers)
          </h3>
          <div className="space-y-3">
            {blockers.map((entity, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 bg-[#FF4B6A]/10 border-l-4 border-[#FF4B6A] rounded"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-white font-bold text-lg">{entity.name}</h4>
                    <p className="text-[#FF4B6A] text-sm font-bold">
                      Risco {entity.risk} • Sensibilidade {entity.sensitivity}
                    </p>
                  </div>
                  <div className="px-3 py-1 bg-[#FF4B6A]/20 rounded-full">
                    <span className="text-[#FF4B6A] text-xs font-bold">⛔ BLOCKER</span>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-[#A9B2C7] mb-1">Campos Sensíveis:</p>
                    <div className="flex items-center gap-2">
                      <code className="bg-[#05070B] px-2 py-1 rounded text-[#19E0FF] text-xs">
                        {showPasswords ? entity.fields : entity.fields.replace(/password/gi, '***')}
                      </code>
                      {entity.fields.toLowerCase().includes('password') && (
                        <button
                          onClick={() => setShowPasswords(!showPasswords)}
                          className="text-[#A9B2C7] hover:text-white"
                        >
                          {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-[#A9B2C7] mb-1">Configuração Dashboard:</p>
                    <code className="bg-[#05070B] px-2 py-1 rounded text-[#10B981] text-xs block">
                      {entity.dashboardConfig}
                    </code>
                  </div>
                  
                  <div>
                    <p className="text-[#A9B2C7] mb-1">Justificativa:</p>
                    <p className="text-white text-xs">{entity.reasoning}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* High Priority */}
        {highPriority.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#F7CE46]" />
              ⚠️ Alta Prioridade (Recomendado)
            </h3>
            <div className="space-y-2">
              {highPriority.map((entity, i) => (
                <div
                  key={i}
                  className="p-3 bg-[#F7CE46]/10 border-l-4 border-[#F7CE46] rounded"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-white font-bold">{entity.name}</p>
                    <code className="bg-[#05070B] px-2 py-1 rounded text-[#10B981] text-xs">
                      {entity.dashboardConfig}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={copyRBACGuide}
          className="w-full bg-gradient-to-r from-[#FF4B6A] to-[#19E0FF] text-white font-bold text-lg py-6"
        >
          <Copy className="w-5 h-5 mr-2" />
          📋 Copiar Guia Completo de RBAC
        </Button>
      </GlowCard>

      {/* Quick Reference */}
      <GlowCard className="p-6">
        <h3 className="text-lg font-bold text-white mb-4">⚡ Referência Rápida</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <p className="text-[#19E0FF] font-bold">Admin Only:</p>
            <ul className="text-[#A9B2C7] space-y-1">
              {blockers.filter(e => e.requiredAccess === 'Somente Admins').map((e, i) => (
                <li key={i}>• {e.name}</li>
              ))}
            </ul>
          </div>
          <div className="space-y-2">
            <p className="text-[#F7CE46] font-bold">User Own + Admin:</p>
            <ul className="text-[#A9B2C7] space-y-1">
              {[...blockers, ...highPriority].filter(e => e.requiredAccess.includes('Own')).map((e, i) => (
                <li key={i}>• {e.name}</li>
              ))}
            </ul>
          </div>
        </div>
      </GlowCard>
    </div>
  );
}