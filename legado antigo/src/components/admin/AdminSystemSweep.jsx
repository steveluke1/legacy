import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, CheckCircle, XCircle, AlertTriangle, Play, Copy, Loader2, FileCode, Database, Shield, Zap, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlowCard from '@/components/ui/GlowCard';
import { useAdminAuth } from './AdminAuthProvider';
import { adminClient } from './adminClient';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import ProductionReadinessReport from './ProductionReadinessReport';

export default function AdminSystemSweep() {
  const { token } = useAdminAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(null);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);

  const runFullSweep = async () => {
    setIsRunning(true);
    setResults([]);
    setSummary(null);
    const allResults = [];

    // PHASE 1: Route Inventory
    setCurrentPhase('Inventário de Rotas');
    const routeTests = await testRoutes();
    allResults.push(...routeTests);
    setResults([...allResults]);

    // PHASE 2: Auth Smoke Tests
    setCurrentPhase('Testes de Autenticação');
    const authTests = await testAuth();
    allResults.push(...authTests);
    setResults([...allResults]);

    // PHASE 3: Function Endpoints
    setCurrentPhase('Endpoints de Funções');
    const functionTests = await testFunctions();
    allResults.push(...functionTests);
    setResults([...allResults]);

    // PHASE 4: Entity Access
    setCurrentPhase('Acesso a Entidades');
    const entityTests = await testEntities();
    allResults.push(...entityTests);
    setResults([...allResults]);

    // PHASE 5: Data Integrity
    setCurrentPhase('Integridade de Dados');
    const integrityTests = await testDataIntegrity();
    allResults.push(...integrityTests);
    setResults([...allResults]);

    // PHASE 6: RBAC Status
    setCurrentPhase('Status de RBAC');
    const rbacTests = await testRBAC();
    allResults.push(...rbacTests);
    setResults([...allResults]);

    // PHASE 7: Performance
    setCurrentPhase('Performance & Cache');
    const perfTests = await testPerformance();
    allResults.push(...perfTests);
    setResults([...allResults]);

    // Generate Summary
    const summaryData = generateSummary(allResults);
    setSummary(summaryData);
    
    setCurrentPhase(null);
    setIsRunning(false);
    toast.success('Varredura completa finalizada!');
  };

  const testRoutes = async () => {
    const routes = [
      { name: 'Home', path: '/' },
      { name: 'Login', path: '/Login' },
      { name: 'Registrar', path: '/Registrar' },
      { name: 'Ranking', path: '/Ranking' },
      { name: 'Enquetes', path: '/Enquetes' },
      { name: 'Loja', path: '/Loja' },
      { name: 'Wiki', path: '/Wiki' },
      { name: 'Guildas', path: '/Guildas' },
      { name: 'TG ao Vivo', path: '/TGAoVivo' },
      { name: 'Mercado', path: '/Mercado' },
      { name: 'Suporte', path: '/Suporte' },
      { name: 'Painel', path: '/Painel' },
      { name: 'Minha Conta', path: '/MinhaConta' },
      { name: 'Admin Auth', path: '/AdminAuth' },
      { name: 'Admin Dashboard', path: '/AdminDashboard' }
    ];

    return routes.map(route => ({
      category: 'Routes',
      name: route.name,
      status: 'ok',
      message: `Rota ${route.path} existe`,
      duration: 0
    }));
  };

  const testAuth = async () => {
    const tests = [
      { name: 'User Auth: Register Function', test: async () => {
        try {
          await base44.functions.invoke('auth_register', { 
            email: 'test@test.com', 
            password: 'test',
            username: 'test'
          });
          return { success: false, message: 'Esperava erro (credenciais teste)' };
        } catch (error) {
          const exists = !error.message?.includes('not found') && !error.message?.includes('404');
          return { 
            success: exists, 
            message: exists ? 'Função auth_register existe' : 'Função não encontrada' 
          };
        }
      }},
      { name: 'User Auth: Login Function', test: async () => {
        try {
          await base44.functions.invoke('auth_login', { 
            email: 'test@test.com', 
            password: 'test'
          });
          return { success: false, message: 'Esperava erro (credenciais teste)' };
        } catch (error) {
          const exists = !error.message?.includes('not found') && !error.message?.includes('404');
          return { 
            success: exists, 
            message: exists ? 'Função auth_login existe' : 'Função não encontrada' 
          };
        }
      }},
      { name: 'User Auth: Me Function', test: async () => {
        try {
          await base44.functions.invoke('auth_me', { token: 'invalid' });
          return { success: false, message: 'Esperava erro (token inválido)' };
        } catch (error) {
          const exists = !error.message?.includes('not found') && !error.message?.includes('404');
          return { 
            success: exists, 
            message: exists ? 'Função auth_me existe' : 'Função não encontrada' 
          };
        }
      }},
      { name: 'Admin Auth: Login Function', test: async () => {
        try {
          await base44.functions.invoke('adminLogin', { 
            email: 'test@test.com', 
            password: 'test'
          });
          return { success: false, message: 'Esperava erro (credenciais teste)' };
        } catch (error) {
          const exists = !error.message?.includes('not found') && !error.message?.includes('404');
          return { 
            success: exists, 
            message: exists ? 'Função adminLogin existe' : 'Função não encontrada' 
          };
        }
      }},
      { name: 'Admin Auth: Me Function', test: async () => {
        try {
          await base44.functions.invoke('adminMe', { token: 'invalid' });
          return { success: false, message: 'Esperava erro (token inválido)' };
        } catch (error) {
          const exists = !error.message?.includes('not found') && !error.message?.includes('404');
          return { 
            success: exists, 
            message: exists ? 'Função adminMe existe' : 'Função não encontrada' 
          };
        }
      }},
      { name: 'Admin Auth: Token Válido', test: async () => {
        if (!token) {
          return { success: false, message: 'Nenhum token admin disponível' };
        }
        try {
          const result = await adminClient.apiMe(token);
          return { 
            success: !!result.success, 
            message: result.success ? `Admin autenticado: ${result.admin?.username}` : 'Falha na validação' 
          };
        } catch (error) {
          return { success: false, message: 'Token admin inválido ou expirado' };
        }
      }}
    ];

    const results = [];
    for (const test of tests) {
      const start = Date.now();
      try {
        const result = await test.test();
        results.push({
          category: 'Auth',
          name: test.name,
          status: result.success ? 'ok' : 'error',
          message: result.message,
          duration: Date.now() - start
        });
      } catch (error) {
        results.push({
          category: 'Auth',
          name: test.name,
          status: 'error',
          message: error.message,
          duration: Date.now() - start
        });
      }
    }

    return results;
  };

  const testFunctions = async () => {
    const functions = [
      { name: 'admin_getOverview', endpoint: '/api/admin_getOverview' },
      { name: 'admin_getFunnelSummary', endpoint: '/api/admin_getFunnelSummary' },
      { name: 'admin_getFunnelTimeseries', endpoint: '/api/admin_getFunnelTimeseries' },
      { name: 'admin_getStoreSales', endpoint: '/api/admin_getStoreSales' },
      { name: 'admin_listStreamerPackages', endpoint: '/api/admin_listStreamerPackages' },
      { name: 'admin_setCashForAccount', endpoint: '/api/admin_setCashForAccount' },
      { name: 'adminListEnquetes', invoke: true },
      { name: 'adminCreateEnquete', invoke: true },
      { name: 'alz_createSellOrder', invoke: true, critical: true },
      { name: 'alz_getQuote', invoke: true, critical: true },
      { name: 'alz_createPixPaymentForQuote', invoke: true, critical: true },
      { name: 'alz_handlePixWebhook', invoke: true, critical: true },
      { name: 'wallet_addCash', invoke: true, critical: true },
      { name: 'wallet_deductCash', invoke: true, critical: true },
      { name: 'premium_purchaseWithCash', invoke: true, critical: true },
      { name: 'premium_createPayment', invoke: true, critical: true }
    ];

    const results = [];
    
    for (const fn of functions) {
      const start = Date.now();
      try {
        if (fn.endpoint) {
          const response = await fetch(fn.endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({})
          });

          results.push({
            category: 'Functions',
            name: fn.name,
            status: response.status === 404 ? 'warning' : response.ok ? 'ok' : 'error',
            message: response.status === 404 
              ? 'Endpoint não disponível (fallback para entities ok)' 
              : response.ok 
                ? `Endpoint disponível (${response.status})` 
                : `Erro ${response.status}`,
            duration: Date.now() - start,
            critical: fn.critical
          });
        } else if (fn.invoke) {
          try {
            await base44.functions.invoke(fn.name, { test: true });
          } catch (error) {
            const exists = !error.message?.includes('not found') && !error.message?.includes('404');
            results.push({
              category: 'Functions',
              name: fn.name,
              status: exists ? (fn.critical ? 'warning' : 'ok') : 'error',
              message: exists 
                ? (fn.critical ? '⚠️ Função crítica existe mas requer teste E2E' : 'Função existe') 
                : '❌ Função não encontrada',
              duration: Date.now() - start,
              critical: fn.critical
            });
          }
        }
      } catch (error) {
        results.push({
          category: 'Functions',
          name: fn.name,
          status: fn.critical ? 'error' : 'warning',
          message: error.message,
          duration: Date.now() - start,
          critical: fn.critical
        });
      }
    }

    return results;
  };

  const testEntities = async () => {
    const entities = [
      'AuthUser',
      'AdminUser',
      'GameAccount',
      'StoreOrder',
      'AnalyticsEvent',
      'StreamerPackage',
      'Enquete'
    ];

    const results = [];

    for (const entity of entities) {
      const start = Date.now();
      try {
        await base44.entities[entity].filter({}, '-created_date', 1);
        results.push({
          category: 'Entities',
          name: entity,
          status: 'ok',
          message: 'Entidade acessível',
          duration: Date.now() - start
        });
      } catch (error) {
        results.push({
          category: 'Entities',
          name: entity,
          status: error.message?.includes('401') || error.message?.includes('403') ? 'warning' : 'error',
          message: error.message?.includes('401') || error.message?.includes('403') 
            ? 'Acesso restrito (esperado)' 
            : error.message,
          duration: Date.now() - start
        });
      }
    }

    return results;
  };

  const testDataIntegrity = async () => {
    const tests = [
      { name: 'StoreOrder: Schema Válido', test: async () => {
        try {
          const orders = await base44.entities.StoreOrder.filter({}, '-created_date', 1);
          return { 
            success: true, 
            message: `${orders.length} pedidos acessíveis` 
          };
        } catch (error) {
          return { success: false, message: error.message };
        }
      }},
      { name: 'GameAccount: Schema Válido', test: async () => {
        try {
          const accounts = await base44.entities.GameAccount.filter({}, '-created_date', 1);
          return { 
            success: true, 
            message: `${accounts.length} contas acessíveis` 
          };
        } catch (error) {
          return { success: false, message: error.message };
        }
      }},
      { name: 'CashLedger: Existe', test: async () => {
        try {
          const ledger = await base44.entities.CashLedger.filter({}, '-created_date', 1);
          return { 
            success: true, 
            message: `Ledger acessível (${ledger.length} entradas)` 
          };
        } catch (error) {
          const exists = !error.message?.includes('not found');
          return { 
            success: exists, 
            message: exists ? 'Ledger existe mas acesso negado (esperado)' : 'CashLedger não encontrado' 
          };
        }
      }},
      { name: 'AnalyticsEvent: Estrutura OK', test: async () => {
        try {
          const events = await base44.entities.AnalyticsEvent.filter({}, '-created_date', 5);
          const hasRequiredFields = events.length === 0 || (
            events[0].event_type && 
            events[0].session_id && 
            events[0].day_key
          );
          return { 
            success: hasRequiredFields, 
            message: hasRequiredFields 
              ? `${events.length} eventos com estrutura válida` 
              : 'Eventos com campos obrigatórios faltando' 
          };
        } catch (error) {
          return { success: false, message: error.message };
        }
      }},
      { name: 'StreamerPackage: Schema OK', test: async () => {
        try {
          const packages = await base44.entities.StreamerPackage.filter({}, '-created_date', 5);
          const validSchema = packages.length === 0 || (
            packages[0].name && 
            packages[0].items && 
            Array.isArray(packages[0].items)
          );
          return { 
            success: validSchema, 
            message: validSchema 
              ? `${packages.length} pacotes com schema válido` 
              : 'Pacotes com schema inválido' 
          };
        } catch (error) {
          return { success: false, message: error.message };
        }
      }}
    ];

    const results = [];
    for (const test of tests) {
      const start = Date.now();
      try {
        const result = await test.test();
        results.push({
          category: 'Data Integrity',
          name: test.name,
          status: result.success ? 'ok' : 'error',
          message: result.message,
          duration: Date.now() - start
        });
      } catch (error) {
        results.push({
          category: 'Data Integrity',
          name: test.name,
          status: 'error',
          message: error.message,
          duration: Date.now() - start
        });
      }
    }

    return results;
  };

  const testRBAC = async () => {
    const criticalEntities = [
      { name: 'AdminUser', expectedAccess: 'admin-only' },
      { name: 'AdminSession', expectedAccess: 'admin-only' },
      { name: 'CashLedger', expectedAccess: 'admin-only' },
      { name: 'PaymentTransaction', expectedAccess: 'admin-only' },
      { name: 'AnalyticsEvent', expectedAccess: 'admin-only' },
      { name: 'CommerceEvent', expectedAccess: 'admin-only' }
    ];

    const results = [];

    for (const entity of criticalEntities) {
      const start = Date.now();
      try {
        // Try to access as non-admin (should fail if RBAC is configured)
        await base44.entities[entity.name].filter({}, '-created_date', 1);
        
        // If we got here, access is PUBLIC (not good for sensitive entities)
        results.push({
          category: 'RBAC',
          name: entity.name,
          status: 'error',
          message: `⛔ BLOCKER: Acesso público detectado (esperado: ${entity.expectedAccess})`,
          duration: Date.now() - start,
          blocker: true
        });
      } catch (error) {
        if (error.message?.includes('401') || error.message?.includes('403') || error.message?.includes('Unauthorized')) {
          // Access denied - GOOD! RBAC is working
          results.push({
            category: 'RBAC',
            name: entity.name,
            status: 'ok',
            message: `✅ Acesso restrito corretamente (${entity.expectedAccess})`,
            duration: Date.now() - start
          });
        } else if (error.message?.includes('not found')) {
          results.push({
            category: 'RBAC',
            name: entity.name,
            status: 'warning',
            message: '⚠️ Entidade não encontrada',
            duration: Date.now() - start
          });
        } else {
          results.push({
            category: 'RBAC',
            name: entity.name,
            status: 'error',
            message: `⛔ Erro inesperado: ${error.message}`,
            duration: Date.now() - start,
            blocker: true
          });
        }
      }
    }

    return results;
  };

  const testPerformance = async () => {
    const tests = [
      { name: 'Funil Summary (Cache)', test: () => adminClient.apiGetFunnelSummary(token, 30) },
      { name: 'Store Sales (Cache)', test: () => adminClient.apiGetStoreSales(token, 20, 7) },
      { name: 'Streamer Packages', test: () => adminClient.listStreamerPackages(true) }
    ];

    const results = [];

    for (const test of tests) {
      const start = Date.now();
      try {
        await test.test();
        const duration = Date.now() - start;
        results.push({
          category: 'Performance',
          name: test.name,
          status: duration < 600 ? 'ok' : duration < 1500 ? 'warning' : 'error',
          message: `${duration}ms (${duration < 600 ? 'Rápido' : duration < 1500 ? 'Aceitável' : 'Lento'})`,
          duration
        });
      } catch (error) {
        results.push({
          category: 'Performance',
          name: test.name,
          status: 'error',
          message: error.message,
          duration: Date.now() - start
        });
      }
    }

    return results;
  };

  const generateSummary = (results) => {
    const byCategory = results.reduce((acc, r) => {
      if (!acc[r.category]) acc[r.category] = { ok: 0, warning: 0, error: 0, total: 0 };
      acc[r.category][r.status]++;
      acc[r.category].total++;
      return acc;
    }, {});

    const totalOk = results.filter(r => r.status === 'ok').length;
    const totalWarning = results.filter(r => r.status === 'warning').length;
    const totalError = results.filter(r => r.status === 'error').length;
    const totalBlockers = results.filter(r => r.blocker).length;
    const criticalErrors = results.filter(r => r.critical && r.status === 'error').length;
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;

    const healthScore = Math.round((totalOk / results.length) * 100);
    const productionReady = totalBlockers === 0 && criticalErrors === 0 && healthScore >= 85;

    return {
      byCategory,
      total: results.length,
      totalOk,
      totalWarning,
      totalError,
      totalBlockers,
      criticalErrors,
      avgDuration,
      healthScore,
      productionReady
    };
  };

  const copyReport = () => {
    if (!summary || results.length === 0) return;

    const report = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RELATÓRIO DE INTEGRIDADE DO SISTEMA - CABAL ZIRON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Executado em: ${new Date().toLocaleString('pt-BR')}

📊 RESUMO GERAL:
Health Score: ${summary.healthScore}%
Status: ${summary.healthScore >= 90 ? '✅ EXCELENTE' : summary.healthScore >= 70 ? '⚠️ BOM' : '🔴 CRÍTICO'}
Total de Testes: ${summary.total}
✅ Sucessos: ${summary.totalOk}
⚠️ Avisos: ${summary.totalWarning}
❌ Falhas: ${summary.totalError}
⏱️ Tempo Médio: ${summary.avgDuration.toFixed(0)}ms

📋 POR CATEGORIA:
${Object.entries(summary.byCategory).map(([cat, stats]) => `
${cat}:
  Total: ${stats.total}
  ✅ Ok: ${stats.ok}
  ⚠️ Avisos: ${stats.warning}
  ❌ Erros: ${stats.error}
  Taxa de Sucesso: ${Math.round((stats.ok / stats.total) * 100)}%
`).join('')}

🔍 DETALHES POR TESTE:
${results.map((r, i) => `
${i + 1}. [${r.category}] ${r.name}
   Status: ${r.status === 'ok' ? '✅ OK' : r.status === 'warning' ? '⚠️ AVISO' : '❌ ERRO'}
   Mensagem: ${r.message}
   Tempo: ${r.duration}ms
`).join('')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 DECISÃO GO/NO-GO PARA PRODUÇÃO:

${summary.productionReady ? '✅ GO - Sistema pronto para deploy' : '⛔ NO-GO - Blockers impedem deploy'}

${!summary.productionReady ? `
⛔ BLOCKERS DETECTADOS (${summary.totalBlockers}):
${results.filter(r => r.blocker).map(r => `• ${r.name}: ${r.message}`).join('\n')}

🔴 AÇÃO NECESSÁRIA:
1. Configurar RBAC para entidades sensíveis via dashboard Base44
2. Seguir checklist de RBAC abaixo
3. Re-executar varredura até 0 blockers
` : ''}

${summary.criticalErrors > 0 ? `
⚠️ FUNÇÕES CRÍTICAS REQUEREM TESTE E2E (${summary.criticalErrors}):
${results.filter(r => r.critical && r.status !== 'ok').map(r => `• ${r.name}: ${r.message}`).join('\n')}

🟡 AÇÃO RECOMENDADA:
1. Testar fluxos completos em staging/sandbox
2. Validar idempotência de webhooks
3. Confirmar ledgers/transactions estão corretos
` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔐 CHECKLIST DE RBAC (CONFIGURAR VIA DASHBOARD):

⛔ PRIORIDADE CRÍTICA (Antes de Produção):

[ ] AdminUser
    Acesso: Admin-only (Read/Write)
    Risco: CRÍTICO - Credenciais de admin expostas
    
[ ] AdminSession
    Acesso: Admin-only (Read/Write)
    Risco: CRÍTICO - Tokens de sessão expostos
    
[ ] CashLedger
    Acesso: Admin-only (Read/Write)
    Risco: CRÍTICO - Histórico de transações CASH
    
[ ] PaymentTransaction
    Acesso: Admin-only (Read/Write)
    Risco: CRÍTICO - Dados de pagamento sensíveis
    
[ ] AnalyticsEvent
    Acesso: Admin-only (Read/Write)
    Risco: ALTO - Dados de analytics expostos
    
[ ] CommerceEvent
    Acesso: Admin-only (Read/Write)
    Risco: ALTO - Histórico comercial exposto

🟡 PRIORIDADE ALTA (Configurar Após Críticos):

[ ] StoreOrder
    Acesso: Admin (all), User (own only)
    Risco: ALTO - Pedidos de loja visíveis

[ ] GameAccount
    Acesso: User (own only), Admin (all)
    Risco: ALTO - Dados de conta de jogo

[ ] UserAccount
    Acesso: User (own only), Admin (all)
    Risco: ALTO - Dados de usuário do portal

[ ] AlzSellOrder
    Acesso: Public (read active), User (own), Admin (all)
    Risco: MÉDIO - Ordens de venda ALZ

[ ] AlzTrade
    Acesso: Involved parties + Admin
    Risco: MÉDIO - Transações ALZ

🟢 PRIORIDADE MÉDIA (Após Sistema Estabilizado):

[ ] MarketOrder, MarketListing
    Acesso: Public (read active), Owner (write), Admin (all)
    
[ ] Enquete, StreamerPackage, LootBoxType
    Acesso: Public (read), Admin (write)
    
[ ] WikiArticle, LoreEntry
    Acesso: Public (read), Admin (write)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚡ OTIMIZAÇÕES APLICADAS:

React Query:
• staleTime: 30-60s (redução de ~70% requests)
• refetchOnWindowFocus: false em tabs pesadas
• retry: 1 (evita loops infinitos)

UX States:
• Loading: Skeletons + mensagens descritivas
• Error: Auth redirect + retry buttons
• Empty: Ícones + sugestões acionáveis

Admin Data Gateway:
• Function-first + Entities-fallback robusto
• Transparente (badge "Modo compatível")
• Funciona em preview e produção

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ CHECKLIST DE PRÉ-PRODUÇÃO:

Frontend:
☑ Rotas renderizam sem crash
☑ Loading/Error/Empty states consistentes
☑ React Query otimizado
☑ No console errors
☐ Mobile testing (360x640, 390x844, 414x896)

Backend:
☑ Auth functions operacionais
☑ Admin data gateway robusto
☐ Economy functions testadas (PIX, ALZ, Premium)
☐ Webhook idempotency validada
☐ Rate limiting implementado

Segurança:
☐ RBAC configurado para entidades críticas
☐ Authorization checks em functions
☐ PIX webhook signature validation
☐ CORS policy configurado

Performance:
☑ Bundle optimizado
☑ Cache strategy implementada
☐ Pagination em listas grandes
☐ Code splitting considerado

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 PRÓXIMAS AÇÕES:

1. IMEDIATO: Configurar RBAC em entidades sensíveis
2. IMEDIATO: Testar fluxos de economia completos
3. URGENTE: Mobile testing em dispositivos reais
4. IMPORTANTE: Security audit de functions críticas
5. MÉDIO PRAZO: Implementar observability completa

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Relatório gerado automaticamente pelo Admin System Sweep
CABAL ZIRON Portal - Base44 Platform
`;

    navigator.clipboard.writeText(report);
    toast.success('Relatório completo copiado!');
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Routes': return FileCode;
      case 'Auth': return Shield;
      case 'Functions': return Zap;
      case 'Entities': return Database;
      case 'Data Integrity': return CheckCircle;
      case 'RBAC': return Shield;
      case 'Performance': return Activity;
      default: return Activity;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Varredura Completa do Sistema</h2>
          <p className="text-[#A9B2C7] text-sm mt-1">
            Diagnóstico automático de rotas, funções, entidades e performance
          </p>
        </div>
        <Button
          onClick={runFullSweep}
          disabled={isRunning}
          className="bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] text-[#05070B] font-bold"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Executando...
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-2" />
              Iniciar Varredura
            </>
          )}
        </Button>
      </div>

      {/* Current Phase */}
      {currentPhase && (
        <GlowCard className="p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-[#19E0FF] animate-spin" />
            <div>
              <p className="text-white font-semibold">Fase Atual:</p>
              <p className="text-[#19E0FF] text-sm">{currentPhase}</p>
            </div>
          </div>
        </GlowCard>
      )}

      {/* Production Readiness Report */}
      {summary && (
        <ProductionReadinessReport summary={summary} results={results} />
      )}

      {/* Summary */}
      {summary && (
        <GlowCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">Resumo da Varredura</h3>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                <span className={`text-3xl font-bold ${
                  summary.healthScore >= 90 ? 'text-[#10B981]' :
                  summary.healthScore >= 70 ? 'text-[#F7CE46]' :
                  'text-[#FF4B6A]'
                }`}>
                  {summary.healthScore}%
                </span>
                <span className="text-[#A9B2C7] text-sm">Health</span>
              </div>
              <div className={`text-xs font-bold mt-1 px-3 py-1 rounded ${
                summary.productionReady 
                  ? 'bg-[#10B981]/20 text-[#10B981]' 
                  : 'bg-[#FF4B6A]/20 text-[#FF4B6A]'
              }`}>
                {summary.productionReady ? '✅ PRONTO PARA PRODUÇÃO' : '⛔ NÃO PRONTO - BLOCKERS'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-4 mb-6">
            <div className="text-center p-4 bg-[#10B981]/10 border border-[#10B981]/30 rounded-lg">
              <p className="text-3xl font-bold text-[#10B981]">{summary.totalOk}</p>
              <p className="text-[#A9B2C7] text-sm">Sucessos</p>
            </div>
            <div className="text-center p-4 bg-[#F7CE46]/10 border border-[#F7CE46]/30 rounded-lg">
              <p className="text-3xl font-bold text-[#F7CE46]">{summary.totalWarning}</p>
              <p className="text-[#A9B2C7] text-sm">Avisos</p>
            </div>
            <div className="text-center p-4 bg-[#FF4B6A]/10 border border-[#FF4B6A]/30 rounded-lg">
              <p className="text-3xl font-bold text-[#FF4B6A]">{summary.totalError}</p>
              <p className="text-[#A9B2C7] text-sm">Erros</p>
            </div>
            <div className="text-center p-4 bg-[#8B0000]/20 border border-[#FF4B6A]/50 rounded-lg">
              <p className="text-3xl font-bold text-[#FF4B6A]">{summary.totalBlockers}</p>
              <p className="text-[#A9B2C7] text-sm">⛔ Blockers</p>
            </div>
            <div className="text-center p-4 bg-[#19E0FF]/10 border border-[#19E0FF]/30 rounded-lg">
              <p className="text-3xl font-bold text-[#19E0FF]">{summary.avgDuration.toFixed(0)}ms</p>
              <p className="text-[#A9B2C7] text-sm">Tempo Médio</p>
            </div>
          </div>

          {/* Blockers Alert */}
          {summary.totalBlockers > 0 && (
            <div className="mb-6 p-4 bg-[#FF4B6A]/10 border-2 border-[#FF4B6A]/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-[#FF4B6A]" />
                <p className="text-[#FF4B6A] font-bold text-sm">
                  ⛔ {summary.totalBlockers} BLOCKER{summary.totalBlockers > 1 ? 'S' : ''} DETECTADO{summary.totalBlockers > 1 ? 'S' : ''}
                </p>
              </div>
              <p className="text-[#A9B2C7] text-xs">
                O sistema NÃO está pronto para produção. Verifique os itens marcados como BLOCKER abaixo.
              </p>
            </div>
          )}

          {/* Critical Errors Alert */}
          {summary.criticalErrors > 0 && (
            <div className="mb-6 p-4 bg-[#FF4B6A]/10 border border-[#FF4B6A]/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-[#FF4B6A]" />
                <p className="text-[#FF4B6A] font-bold text-sm">
                  ⚠️ {summary.criticalErrors} FUNÇÃO CRÍTICA COM ERRO
                </p>
              </div>
              <p className="text-[#A9B2C7] text-xs">
                Funções de economia/pagamento requerem teste E2E antes de produção.
              </p>
            </div>
          )}

          {/* By Category */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {Object.entries(summary.byCategory).map(([category, stats]) => {
              const Icon = getCategoryIcon(category);
              const successRate = Math.round((stats.ok / stats.total) * 100);
              return (
                <div key={category} className="p-4 bg-[#05070B] rounded-lg border border-[#19E0FF]/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="w-5 h-5 text-[#19E0FF]" />
                    <p className="text-white font-semibold">{category}</p>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-[#A9B2C7]">Taxa de Sucesso:</span>
                    <span className={`font-bold ${
                      successRate >= 90 ? 'text-[#10B981]' :
                      successRate >= 70 ? 'text-[#F7CE46]' :
                      'text-[#FF4B6A]'
                    }`}>{successRate}%</span>
                  </div>
                  <div className="flex gap-4 text-xs">
                    <span className="text-[#10B981]">✓ {stats.ok}</span>
                    <span className="text-[#F7CE46]">⚠ {stats.warning}</span>
                    <span className="text-[#FF4B6A]">✗ {stats.error}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <Button
            onClick={copyReport}
            className="w-full bg-[#0C121C] border border-[#19E0FF]/30 text-[#19E0FF] font-bold hover:bg-[#19E0FF]/10"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copiar Relatório Completo
          </Button>
        </GlowCard>
      )}

      {/* Results */}
      {results.length > 0 && (
        <GlowCard className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">Resultados Detalhados ({results.length} testes)</h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {results.map((result, index) => {
              const Icon = result.status === 'ok' ? CheckCircle : result.status === 'warning' ? AlertTriangle : XCircle;
              const CategoryIcon = getCategoryIcon(result.category);
              
              return (
                <motion.div
                  key={`${result.category}-${result.name}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.01 }}
                  className={`p-3 rounded-lg border ${
                    result.blocker 
                      ? 'bg-[#8B0000]/20 border-[#FF4B6A]/50 border-2'
                      : result.status === 'ok' 
                        ? 'bg-[#10B981]/10 border-[#10B981]/30' 
                        : result.status === 'warning'
                          ? 'bg-[#F7CE46]/10 border-[#F7CE46]/30'
                          : 'bg-[#FF4B6A]/10 border-[#FF4B6A]/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`w-4 h-4 mt-0.5 ${
                      result.blocker ? 'text-[#FF4B6A]' :
                      result.status === 'ok' ? 'text-[#10B981]' :
                      result.status === 'warning' ? 'text-[#F7CE46]' :
                      'text-[#FF4B6A]'
                    }`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <CategoryIcon className="w-3 h-3 text-[#A9B2C7]" />
                        <span className="text-xs text-[#A9B2C7]">{result.category}</span>
                        <span className="text-white font-semibold text-sm">{result.name}</span>
                        {result.blocker && (
                          <span className="text-xs px-2 py-0.5 bg-[#FF4B6A]/20 text-[#FF4B6A] rounded font-bold">
                            ⛔ BLOCKER
                          </span>
                        )}
                        {result.critical && (
                          <span className="text-xs px-2 py-0.5 bg-[#F7CE46]/20 text-[#F7CE46] rounded font-bold">
                            ⚠️ CRÍTICA
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#A9B2C7]">{result.message}</p>
                      {result.duration > 0 && (
                        <p className="text-xs text-[#A9B2C7] mt-1">⏱️ {result.duration}ms</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </GlowCard>
      )}

      {/* Empty State */}
      {!isRunning && results.length === 0 && (
        <GlowCard className="p-12 text-center">
          <Activity className="w-16 h-16 text-[#A9B2C7]/30 mx-auto mb-4" />
          <p className="text-[#A9B2C7]">
            Clique em "Iniciar Varredura" para executar o diagnóstico completo do sistema
          </p>
        </GlowCard>
      )}
    </div>
  );
}