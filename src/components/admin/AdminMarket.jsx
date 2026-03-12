import React, { useState, useEffect } from 'react';
import { Activity, Filter, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import GlowCard from '@/components/ui/GlowCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const actionLabels = {
  LISTING_CREATED: { label: 'Anúncio criado', color: 'bg-green-500/20 text-green-400' },
  LISTING_CANCELLED: { label: 'Anúncio cancelado', color: 'bg-red-500/20 text-red-400' },
  ORDER_CREATED: { label: 'Pedido criado', color: 'bg-blue-500/20 text-blue-400' },
  ORDER_PAID: { label: 'Pedido pago', color: 'bg-green-500/20 text-green-400' },
  ORDER_COMPLETED: { label: 'Pedido concluído', color: 'bg-blue-500/20 text-blue-400' },
  ORDER_CANCELLED: { label: 'Pedido cancelado', color: 'bg-red-500/20 text-red-400' },
  ORDER_REFUNDED: { label: 'Pedido reembolsado', color: 'bg-purple-500/20 text-purple-400' }
};

export default function AdminMarket() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    loadLogs();
  }, [actionFilter]);

  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await base44.functions.invoke('market_listAdminLogs', {
        action_filter: actionFilter || undefined,
        limit: 50
      });
      if (response.data && response.data.success) {
        setLogs(response.data.logs || []);
      } else {
        setLogs([]);
      }
    } catch (e) {
      console.error('Erro ao carregar logs:', e);
      setError(e.message);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-16 h-16 text-[#FF4B6A] mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Erro ao carregar logs do mercado</h3>
        <p className="text-[#A9B2C7] mb-6">{error}</p>
        <Button
          onClick={loadLogs}
          className="bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] text-[#05070B] font-bold"
        >
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Auditoria de Mercado</h2>

      <GlowCard className="p-6 mb-6">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-[#19E0FF]" />
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-64 bg-[#05070B] border-[#19E0FF]/20 text-white">
              <SelectValue placeholder="Filtrar por ação" />
            </SelectTrigger>
            <SelectContent className="bg-[#0C121C] border-[#19E0FF]/20">
              <SelectItem value={null}>Todas as ações</SelectItem>
              {Object.keys(actionLabels).map(action => (
                <SelectItem key={action} value={action}>
                  {actionLabels[action].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </GlowCard>

      <GlowCard className="overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="h-16 bg-[#19E0FF]/10" />
            ))}
            <p className="text-center text-[#A9B2C7] text-sm mt-4">Carregando logs do mercado...</p>
          </div>
        ) : logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#05070B]">
                <tr className="border-b border-[#19E0FF]/10">
                  <th className="text-left py-4 px-4 text-[#A9B2C7] font-medium text-sm">Data/Hora</th>
                  <th className="text-left py-4 px-4 text-[#A9B2C7] font-medium text-sm">Ação</th>
                  <th className="text-left py-4 px-4 text-[#A9B2C7] font-medium text-sm">Usuário</th>
                  <th className="text-left py-4 px-4 text-[#A9B2C7] font-medium text-sm">Listing ID</th>
                  <th className="text-left py-4 px-4 text-[#A9B2C7] font-medium text-sm">Order ID</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const actionStyle = actionLabels[log.action];
                  return (
                    <tr 
                      key={log.id}
                      className="border-b border-[#19E0FF]/5 hover:bg-[#19E0FF]/5 transition-colors"
                    >
                      <td className="py-4 px-4 text-[#A9B2C7] text-sm">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={actionStyle?.color}>
                          {actionStyle?.label || log.action}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-white text-sm">
                        {log.username || '-'}
                      </td>
                      <td className="py-4 px-4 text-[#19E0FF] text-xs font-mono">
                        {log.listing_id || '-'}
                      </td>
                      <td className="py-4 px-4 text-[#19E0FF] text-xs font-mono">
                        {log.order_id || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Activity className="w-16 h-16 text-[#A9B2C7]/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Nenhum log encontrado</h3>
            <p className="text-[#A9B2C7]">Ajuste os filtros ou aguarde novas atividades</p>
          </div>
        )}
      </GlowCard>
    </div>
  );
}