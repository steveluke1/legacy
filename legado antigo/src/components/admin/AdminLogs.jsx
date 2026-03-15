import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Filter, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import GlowCard from '@/components/ui/GlowCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SecureFunctionUnavailable from './SecureFunctionUnavailable';

export default function AdminLogs() {
  const [actionFilter, setActionFilter] = useState('all');

  const { data: logs, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-logs', actionFilter],
    queryFn: async () => {
      // SECURITY: Use admin-protected function instead of direct entity access
      // AdminAuditLog is CRITICAL and should not be accessed from frontend
      try {
        const response = await base44.functions.invoke('admin_getAuditLogs', {
          limit: 100,
          action: actionFilter === 'all' ? undefined : actionFilter
        });
        return response.data?.logs || [];
      } catch (error) {
        // Function not found - fail closed, do not fallback to entities
        if (error.response?.status === 404) {
          throw new Error('Esta funcionalidade requer RBAC configurado e função admin_getAuditLogs publicada.');
        }
        throw error;
      }
    },
    staleTime: 30000,
    retry: 1,
    refetchOnWindowFocus: false
  });

  const actionColors = {
    'ADMIN_LOGIN_SUCCESS': '#10B981',
    'ADMIN_LOGIN_FAILED': '#FF4B6A',
    'ADMIN_LOGOUT': '#A9B2C7',
    'ADMIN_SET_CASH': '#F7CE46',
    'ADMIN_VIEW_ANALYTICS': '#19E0FF',
    'ADMIN_INITIAL_SEED': '#9146FF',
    'ADMIN_ACCOUNT_LOCKED': '#FF4B6A'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Logs de Auditoria</h2>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#A9B2C7]" />
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-48 bg-[#0C121C] border-[#19E0FF]/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as ações</SelectItem>
              <SelectItem value="ADMIN_LOGIN_SUCCESS">Login sucesso</SelectItem>
              <SelectItem value="ADMIN_LOGIN_FAILED">Login falhou</SelectItem>
              <SelectItem value="ADMIN_SET_CASH">Set CASH</SelectItem>
              <SelectItem value="ADMIN_VIEW_ANALYTICS">Ver Analytics</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <GlowCard className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 bg-[#19E0FF]/10" />
            ))}
            <p className="text-center text-[#A9B2C7] text-sm mt-4">Carregando logs...</p>
          </div>
        ) : error?.message?.includes('RBAC') || error?.message?.includes('função admin_getAuditLogs') ? (
          <SecureFunctionUnavailable 
            onGoToRBAC={() => {
              const event = new CustomEvent('changeAdminTab', { detail: { tab: 'security' } });
              window.dispatchEvent(event);
            }}
          />
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-[#FF4B6A] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Erro ao carregar logs</h3>
            <p className="text-[#A9B2C7] mb-6">{error.message}</p>
            <Button
              onClick={() => refetch()}
              className="bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] text-[#05070B] font-bold"
            >
              Tentar Novamente
            </Button>
          </div>
        ) : logs && logs.length > 0 ? (
          <div className="space-y-3">
            {logs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#05070B] border border-[#19E0FF]/10 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span 
                        className="px-2 py-1 rounded text-xs font-medium"
                        style={{
                          backgroundColor: `${actionColors[log.action] || '#A9B2C7'}20`,
                          color: actionColors[log.action] || '#A9B2C7'
                        }}
                      >
                        {log.action}
                      </span>
                      <span className="text-[#A9B2C7] text-sm">
                        {new Date(log.created_date).toLocaleString('pt-BR')}
                      </span>
                    </div>
                    
                    {log.target_type && (
                      <p className="text-[#A9B2C7] text-sm mb-1">
                        <span className="text-white">Alvo:</span> {log.target_type} {log.target_id && `(${log.target_id.substring(0, 8)}...)`}
                      </p>
                    )}
                    
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-[#19E0FF] text-sm cursor-pointer hover:underline">
                          Ver detalhes
                        </summary>
                        <pre className="mt-2 bg-[#0C121C] p-3 rounded text-xs text-[#A9B2C7] overflow-x-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                  
                  {log.admin_user_id && (
                    <div className="text-right">
                      <p className="text-[#A9B2C7] text-xs">Admin ID</p>
                      <p className="text-white text-sm font-mono">{log.admin_user_id.substring(0, 8)}...</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-[#A9B2C7] mx-auto mb-4" />
            <p className="text-[#A9B2C7]">Nenhum log encontrado</p>
          </div>
        )}
      </GlowCard>
    </div>
  );
}