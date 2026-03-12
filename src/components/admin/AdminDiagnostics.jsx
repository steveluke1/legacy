import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, CheckCircle, XCircle, Clock, Play, Database, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlowCard from '@/components/ui/GlowCard';
import { useAdminAuth } from './AdminAuthProvider';
import { adminClient } from './adminClient';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AdminDiagnostics() {
  const { token } = useAdminAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState([]);
  const [isSeeding, setIsSeeding] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);

    const tests = [
      {
        name: 'Funil - Summary',
        test: async () => {
          const start = Date.now();
          const data = await adminClient.apiGetFunnelSummary(token, 30);
          const duration = Date.now() - start;
          return { 
            success: data.success !== false && data.funnel !== undefined, 
            duration, 
            source: data.notes?.source,
            data: data.funnel 
          };
        }
      },
      {
        name: 'Funil - Timeseries',
        test: async () => {
          const start = Date.now();
          const data = await adminClient.apiGetFunnelTimeseries(token, 30);
          const duration = Date.now() - start;
          return { 
            success: data.success !== false && data.timeseries !== undefined, 
            duration, 
            source: data.notes?.source,
            data: data.timeseries?.length || 0
          };
        }
      },
      {
        name: 'Vendas Loja',
        test: async () => {
          const start = Date.now();
          const data = await adminClient.apiGetStoreSales(token, 100, 30);
          const duration = Date.now() - start;
          return { 
            success: data.success !== false && data.summary !== undefined, 
            duration, 
            source: data.notes?.source,
            data: data.summary 
          };
        }
      },
      {
        name: 'Streamer Packages',
        test: async () => {
          const start = Date.now();
          const data = await adminClient.listStreamerPackages(true);
          const duration = Date.now() - start;
          return { 
            success: data.success !== false && data.packages !== undefined, 
            duration, 
            source: data.notes?.source,
            data: data.packages?.length || 0
          };
        }
      },
      {
        name: 'Contas/CASH',
        test: async () => {
          const start = Date.now();
          const data = await adminClient.apiListAccounts(token, '', 1, 20);
          const duration = Date.now() - start;
          return { 
            success: data.success !== false && data.items !== undefined, 
            duration, 
            source: data.notes?.source,
            data: data.items?.length || 0
          };
        }
      },
      {
        name: 'Enquetes',
        test: async () => {
          const start = Date.now();
          const data = await adminClient.apiListEnquetes(token, '', 'all', 'newest');
          const duration = Date.now() - start;
          return { 
            success: data.success !== false && data.items !== undefined, 
            duration, 
            source: data.notes?.source,
            data: data.items?.length || 0
          };
        }
      }
    ];

    const testResults = [];

    for (const test of tests) {
      try {
        const result = await test.test();
        testResults.push({
          name: test.name,
          status: result.success ? 'ok' : 'fail',
          duration: result.duration,
          source: result.source,
          data: result.data,
          error: null
        });
      } catch (error) {
        testResults.push({
          name: test.name,
          status: 'error',
          duration: 0,
          source: null,
          data: null,
          error: error.message
        });
      }
    }

    setResults(testResults);
    setIsRunning(false);
  };

  const seedDemoData = async () => {
    setIsSeeding(true);
    try {
      // Create 2 VIP orders
      await base44.entities.StoreOrder.create({
        order_id: `DEMO_VIP_${Date.now()}_1`,
        idempotency_key: `demo_vip_1_${Date.now()}`,
        buyer_user_id: 'demo_user_1',
        item_type: 'PREMIUM',
        item_sku: 'VIP_SIMPLE',
        item_name: 'VIP Simples (30 dias)',
        quantity: 1,
        price_brl: 29.90,
        payment_method: 'BRL',
        status: 'paid'
      });

      await base44.entities.StoreOrder.create({
        order_id: `DEMO_VIP_${Date.now()}_2`,
        idempotency_key: `demo_vip_2_${Date.now()}`,
        buyer_user_id: 'demo_user_2',
        item_type: 'PREMIUM',
        item_sku: 'VIP_COMPLETE',
        item_name: 'VIP Completo (30 dias)',
        quantity: 1,
        price_brl: 49.90,
        payment_method: 'BRL',
        status: 'fulfilled'
      });

      // Create 2 Box orders
      await base44.entities.StoreOrder.create({
        order_id: `DEMO_BOX_${Date.now()}_1`,
        idempotency_key: `demo_box_1_${Date.now()}`,
        buyer_user_id: 'demo_user_3',
        item_type: 'BOX',
        item_sku: 'BOX_INSIGNIAS',
        item_name: 'Caixa de Insígnias',
        quantity: 1,
        price_cash: 1500,
        payment_method: 'CASH',
        status: 'fulfilled'
      });

      await base44.entities.StoreOrder.create({
        order_id: `DEMO_BOX_${Date.now()}_2`,
        idempotency_key: `demo_box_2_${Date.now()}`,
        buyer_user_id: 'demo_user_4',
        item_type: 'PACKAGE',
        item_sku: 'PKG_STREAMER_BASIC',
        item_name: 'Pacote Streamer Básico',
        quantity: 1,
        price_cash: 5000,
        payment_method: 'CASH',
        status: 'paid'
      });

      // Create 5 funnel events
      const today = new Date().toISOString().split('T')[0];
      for (let i = 0; i < 5; i++) {
        await base44.entities.AnalyticsEvent.create({
          event_type: i === 0 ? 'page_view' : i === 1 ? 'signup_view' : i === 2 ? 'signup_complete' : i === 3 ? 'premium_purchase' : 'alz_trade',
          event_name: `Demo Event ${i + 1}`,
          path: '/',
          role_context: 'public',
          session_id: `demo_session_${i}`,
          anon_id: `demo_anon_${i}`,
          day_key: today,
          dedupe_key: `demo_dedupe_${Date.now()}_${i}`
        });
      }

      // Create 1 streamer package
      await base44.entities.StreamerPackage.create({
        name: 'Pacote Demo Admin',
        items: [
          { label: 'Item Demo 1', quantity: 10, note: 'Demo' },
          { label: 'Item Demo 2', quantity: 5, note: 'Demo' }
        ],
        price_cash: 10000,
        is_active: true,
        sort_order: 0
      });

      toast.success('Dados demo criados com sucesso!');
    } catch (error) {
      console.error('Seed error:', error);
      toast.error('Erro ao criar dados demo: ' + error.message);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Diagnóstico do Sistema</h2>
          <p className="text-[#A9B2C7] text-sm mt-1">
            Teste a conectividade e performance de todos os endpoints admin
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={seedDemoData}
            disabled={isSeeding}
            className="bg-[#0C121C] border border-[#19E0FF]/30 text-white hover:bg-[#19E0FF]/10"
          >
            <Database className="w-5 h-5 mr-2" />
            {isSeeding ? 'Criando...' : 'Seed Dados Demo'}
          </Button>
          <Button
            onClick={runDiagnostics}
            disabled={isRunning}
            className="bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] text-[#05070B] font-bold"
          >
            <Play className="w-5 h-5 mr-2" />
            {isRunning ? 'Executando...' : 'Rodar Diagnóstico'}
          </Button>
        </div>
      </div>

      {results.length > 0 && (
        <GlowCard className="p-6">
          <h3 className="text-lg font-bold text-white mb-4">Resultados dos Testes</h3>
          <div className="space-y-3">
            {results.map((result, index) => (
              <motion.div
                key={result.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-lg border ${
                  result.status === 'ok' 
                    ? 'bg-[#10B981]/10 border-[#10B981]/30'
                    : 'bg-[#FF4B6A]/10 border-[#FF4B6A]/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {result.status === 'ok' ? (
                      <CheckCircle className="w-5 h-5 text-[#10B981]" />
                    ) : (
                      <XCircle className="w-5 h-5 text-[#FF4B6A]" />
                    )}
                    <div>
                      <p className="text-white font-bold">{result.name}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm">
                        {result.status === 'ok' && (
                          <>
                            <span className="text-[#A9B2C7]">
                              Fonte: <span className="text-[#19E0FF] font-semibold">
                                {result.source === 'function' ? 'Function' : 'Entities'}
                              </span>
                            </span>
                            <span className="text-[#A9B2C7]">•</span>
                            <span className={`flex items-center gap-1 ${
                              result.duration <= 600 ? 'text-[#10B981]' : 
                              result.duration <= 1500 ? 'text-[#F7CE46]' : 
                              'text-[#FF4B6A]'
                            }`}>
                              <Clock className="w-3 h-3" />
                              {result.duration}ms
                              <span className="text-xs ml-1">
                                ({result.duration <= 600 ? 'Rápido' : result.duration <= 1500 ? 'Ok' : 'Lento'})
                              </span>
                            </span>
                            {result.data !== null && result.data !== undefined && (
                              <>
                                <span className="text-[#A9B2C7]">•</span>
                                <span className="text-[#10B981]">
                                  {typeof result.data === 'object' 
                                    ? JSON.stringify(result.data).substring(0, 50) + '...'
                                    : `${result.data} items`}
                                </span>
                              </>
                            )}
                          </>
                        )}
                        {result.status !== 'ok' && (
                          <span className="text-[#FF4B6A]">
                            Erro: {result.error || 'Falha desconhecida'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Summary */}
          <div className="mt-6 pt-6 border-t border-[#19E0FF]/20">
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-[#10B981]">
                  {results.filter(r => r.status === 'ok').length}
                </p>
                <p className="text-[#A9B2C7] text-sm">Sucesso</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-[#FF4B6A]">
                  {results.filter(r => r.status !== 'ok').length}
                </p>
                <p className="text-[#A9B2C7] text-sm">Falhas</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-[#19E0FF]">
                  {results.filter(r => r.source === 'entities').length}
                </p>
                <p className="text-[#A9B2C7] text-sm">Via Entities</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-[#F7CE46]">
                  {results.filter(r => r.status === 'ok' && r.duration <= 600).length}
                </p>
                <p className="text-[#A9B2C7] text-sm">Rápidos</p>
              </div>
            </div>

            {/* Performance Warnings */}
            {results.some(r => r.status === 'ok' && r.duration > 1500) && (
              <div className="mt-4 p-3 bg-[#F7CE46]/10 border border-[#F7CE46]/30 rounded-lg">
                <p className="text-[#F7CE46] text-sm font-semibold mb-2">⚠️ Ações Recomendadas:</p>
                <ul className="text-[#A9B2C7] text-xs space-y-1">
                  {results.filter(r => r.status === 'ok' && r.duration > 1500).map(r => (
                    <li key={r.name}>• <span className="text-white">{r.name}</span>: Considere reduzir o limite de entidades ou usar cache</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Copy Report Button */}
            <button
              onClick={() => {
                const report = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RELATÓRIO DE DIAGNÓSTICO ADMIN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Executado em: ${new Date().toLocaleString('pt-BR')}

RESUMO:
✅ Sucessos: ${results.filter(r => r.status === 'ok').length}/${results.length}
❌ Falhas: ${results.filter(r => r.status !== 'ok').length}/${results.length}
🔹 Via Entities: ${results.filter(r => r.source === 'entities').length}
⚡ Rápidos (≤600ms): ${results.filter(r => r.status === 'ok' && r.duration <= 600).length}

DETALHES POR TESTE:
${results.map((r, i) => `
${i + 1}. ${r.name}
   Status: ${r.status === 'ok' ? '✅ OK' : '❌ FAIL'}
   Fonte: ${r.source === 'function' ? 'Function' : 'Entities'}
   Tempo: ${r.duration}ms (${r.duration <= 600 ? 'Rápido' : r.duration <= 1500 ? 'Ok' : 'Lento'})
   ${r.data ? `Dados: ${JSON.stringify(r.data).substring(0, 100)}...` : ''}
`).join('')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                `;
                navigator.clipboard.writeText(report);
                toast.success('Relatório copiado para a área de transferência!');
              }}
              className="w-full mt-4 px-6 py-3 bg-[#0C121C] border border-[#19E0FF]/30 text-[#19E0FF] font-bold rounded-lg hover:bg-[#19E0FF]/10 transition-all"
            >
              📋 Copiar Relatório
            </button>
          </div>
        </GlowCard>
      )}

      {!isRunning && results.length === 0 && (
        <GlowCard className="p-12 text-center">
          <Activity className="w-16 h-16 text-[#A9B2C7]/30 mx-auto mb-4" />
          <p className="text-[#A9B2C7]">
            Clique em "Rodar Diagnóstico" para testar todos os endpoints
          </p>
        </GlowCard>
      )}
    </div>
  );
}