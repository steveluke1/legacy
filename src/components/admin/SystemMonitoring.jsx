import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Search, AlertTriangle, TrendingUp, DollarSign, Scale, Settings, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import GlowCard from '@/components/ui/GlowCard';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

export default function SystemMonitoring() {
  const [correlationSearch, setCorrelationSearch] = useState('');

  // Last 24h metrics
  const { data: metrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ['system-metrics-24h'],
    queryFn: async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      try {
        // Get payments count (last 24h)
        const payments = await base44.asServiceRole.entities.PaymentTransaction.filter({
          created_date: { $gte: yesterday.toISOString() }
        });

        // Get orders count (last 24h)
        const orders = await base44.asServiceRole.entities.StoreOrder.filter({
          created_date: { $gte: yesterday.toISOString() }
        });

        // Get market orders (last 24h)
        const marketOrders = await base44.asServiceRole.entities.MarketOrder?.filter({
          created_date: { $gte: yesterday.toISOString() }
        }) || [];

        return {
          payments: payments.length,
          orders: orders.length,
          marketOrders: marketOrders.length,
          disputes: marketOrders.filter(o => o.status === 'dispute').length
        };
      } catch (error) {
        // If entities are protected (RBAC), return placeholder
        if (error.message?.includes('403')) {
          return {
            payments: '🔒',
            orders: '🔒',
            marketOrders: '🔒',
            disputes: '🔒',
            protected: true
          };
        }
        throw error;
      }
    },
    staleTime: 60000,
    retry: 1
  });

  // Recent webhook events (simplified)
  const { data: webhookEvents, isLoading: loadingWebhooks } = useQuery({
    queryKey: ['recent-webhook-events'],
    queryFn: async () => {
      try {
        // Get recent PIX payments
        const recentPayments = await base44.asServiceRole.entities.AlzPixPayment.list('-created_date', 10);
        return recentPayments.map(p => ({
          id: p.id,
          type: 'PIX Webhook',
          status: p.status,
          timestamp: p.created_date,
          reference: p.provider_reference_id
        }));
      } catch (error) {
        if (error.message?.includes('403')) {
          return [{ protected: true }];
        }
        return [];
      }
    },
    staleTime: 30000,
    retry: 1
  });

  // Correlation ID search
  const searchCorrelation = async (corrId) => {
    if (!corrId) return;
    
    // Search in audit logs for correlation ID
    try {
      const logs = await base44.asServiceRole.entities.AdminAuditLog.filter({
        metadata: { $contains: corrId }
      });
      
      if (logs.length > 0) {
        alert(`Encontrado ${logs.length} log(s) com correlationId: ${corrId}`);
      } else {
        alert(`Nenhum log encontrado para correlationId: ${corrId}`);
      }
    } catch (error) {
      alert('Erro ao buscar correlationId (verifique RBAC)');
    }
  };

  // Anomaly detection (simple thresholds)
  const detectAnomalies = () => {
    if (!metrics || metrics.protected) return [];
    
    const anomalies = [];
    
    if (metrics.payments > 100) {
      anomalies.push({
        type: 'spike',
        message: `⚠️ Spike de pagamentos: ${metrics.payments} em 24h (normal: <100)`,
        severity: 'warn'
      });
    }
    
    if (metrics.disputes > 5) {
      anomalies.push({
        type: 'high_disputes',
        message: `⚠️ Disputas elevadas: ${metrics.disputes} em 24h (normal: <5)`,
        severity: 'warn'
      });
    }

    return anomalies;
  };

  const anomalies = detectAnomalies();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Monitoramento do Sistema</h2>
          <p className="text-[#A9B2C7] text-sm">Métricas das últimas 24 horas</p>
        </div>
      </div>

      {/* 24h Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <GlowCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#10B981]/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-[#10B981]" />
            </div>
            <div>
              <p className="text-[#A9B2C7] text-sm">Pagamentos</p>
              {loadingMetrics ? (
                <Skeleton className="h-8 w-16 bg-[#19E0FF]/10" />
              ) : (
                <p className="text-2xl font-bold text-white">
                  {metrics?.protected ? '🔒' : metrics?.payments || 0}
                </p>
              )}
            </div>
          </div>
        </GlowCard>

        <GlowCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#19E0FF]/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#19E0FF]" />
            </div>
            <div>
              <p className="text-[#A9B2C7] text-sm">Pedidos</p>
              {loadingMetrics ? (
                <Skeleton className="h-8 w-16 bg-[#19E0FF]/10" />
              ) : (
                <p className="text-2xl font-bold text-white">
                  {metrics?.protected ? '🔒' : metrics?.orders || 0}
                </p>
              )}
            </div>
          </div>
        </GlowCard>

        <GlowCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#F7CE46]/20 rounded-lg flex items-center justify-center">
              <Scale className="w-6 h-6 text-[#F7CE46]" />
            </div>
            <div>
              <p className="text-[#A9B2C7] text-sm">Mercado RMT</p>
              {loadingMetrics ? (
                <Skeleton className="h-8 w-16 bg-[#19E0FF]/10" />
              ) : (
                <p className="text-2xl font-bold text-white">
                  {metrics?.protected ? '🔒' : metrics?.marketOrders || 0}
                </p>
              )}
            </div>
          </div>
        </GlowCard>

        <GlowCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#FF4B6A]/20 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6 text-[#FF4B6A]" />
            </div>
            <div>
              <p className="text-[#A9B2C7] text-sm">Disputas</p>
              {loadingMetrics ? (
                <Skeleton className="h-8 w-16 bg-[#19E0FF]/10" />
              ) : (
                <p className="text-2xl font-bold text-white">
                  {metrics?.protected ? '🔒' : metrics?.disputes || 0}
                </p>
              )}
            </div>
          </div>
        </GlowCard>
      </div>

      {/* Anomalies */}
      {anomalies.length > 0 && (
        <GlowCard className="p-6 bg-[#F7CE46]/10 border-[#F7CE46]/30">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#F7CE46]" />
            Anomalias Detectadas
          </h3>
          <div className="space-y-2">
            {anomalies.map((anomaly, i) => (
              <div key={i} className="p-3 bg-[#05070B] rounded">
                <p className="text-[#F7CE46] text-sm">{anomaly.message}</p>
              </div>
            ))}
          </div>
        </GlowCard>
      )}

      {/* Correlation ID Search */}
      <GlowCard className="p-6">
        <h3 className="text-lg font-bold text-white mb-4">Buscar CorrelationId</h3>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A9B2C7]" />
            <Input
              type="text"
              value={correlationSearch}
              onChange={(e) => setCorrelationSearch(e.target.value)}
              placeholder="Ex: webhook_ABC123_1234567890"
              className="pl-10 bg-[#05070B] border-[#19E0FF]/20 text-white"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  searchCorrelation(correlationSearch);
                }
              }}
            />
          </div>
          <button
            onClick={() => searchCorrelation(correlationSearch)}
            className="px-6 py-2 bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] text-white font-bold rounded hover:shadow-lg transition-all"
          >
            Buscar
          </button>
        </div>
        <p className="text-[#A9B2C7] text-xs mt-2">
          Busca logs de auditoria com o correlationId especificado
        </p>
      </GlowCard>

      {/* Recent Webhook Events */}
      <GlowCard className="p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-[#19E0FF]" />
          Eventos Recentes de Webhook
        </h3>
        
        {loadingWebhooks ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-16 bg-[#19E0FF]/10" />
            ))}
          </div>
        ) : webhookEvents && webhookEvents[0]?.protected ? (
          <div className="text-center py-8">
            <p className="text-[#A9B2C7]">🔒 Dados protegidos por RBAC</p>
            <p className="text-[#A9B2C7] text-xs mt-2">Configure permissões para visualizar</p>
          </div>
        ) : webhookEvents && webhookEvents.length > 0 ? (
          <div className="space-y-2">
            {webhookEvents.map((event, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-3 bg-[#05070B] border border-[#19E0FF]/10 rounded flex items-center justify-between"
              >
                <div>
                  <p className="text-white text-sm font-bold">{event.type}</p>
                  <p className="text-[#A9B2C7] text-xs">
                    {event.reference} • {new Date(event.timestamp).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full ${
                  event.status === 'paid' ? 'bg-[#10B981]/20 text-[#10B981]' :
                  event.status === 'pending' ? 'bg-[#F7CE46]/20 text-[#F7CE46]' :
                  'bg-[#A9B2C7]/20 text-[#A9B2C7]'
                }`}>
                  <span className="text-xs font-bold">{event.status}</span>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-[#A9B2C7]/30 mx-auto mb-2" />
            <p className="text-[#A9B2C7]">Nenhum evento recente</p>
          </div>
        )}
      </GlowCard>

      {/* Info */}
      <GlowCard className="p-4 bg-[#19E0FF]/5">
        <p className="text-[#A9B2C7] text-sm">
          <strong className="text-white">💡 Dica:</strong> Este painel oferece monitoramento básico. 
          Para produção, recomendamos configurar Sentry (error tracking) e uptime monitoring externo.
        </p>
      </GlowCard>
    </div>
  );
}