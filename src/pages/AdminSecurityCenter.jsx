import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import RequireAdminAuth from '@/components/admin/RequireAdminAuth';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Activity,
  Lock,
  Eye,
  Clock,
  Filter,
  Mail,
  Send,
  PlayCircle,
  Zap,
  ListChecks
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSecurityCenter() {
  const queryClient = useQueryClient();
  const [severityFilter, setSeverityFilter] = useState('all');
  const [p5aLogs, setP5aLogs] = useState([]);
  const [p5aLoading, setP5aLoading] = useState(false);
  
  // Go-Live Checklist
  const { data: goLiveStatus, isLoading: goLiveLoading } = useQuery({
    queryKey: ['adminSecurityAlertGoLiveStatus'],
    queryFn: async () => {
      const response = await base44.functions.invoke('adminSecurityAlert', { 
        action: 'goLiveStatus'
      });
      
      if (!response.data.ok) {
        throw new Error(response.data.error?.message || 'Erro ao carregar checklist');
      }
      
      return response.data.data;
    },
    refetchInterval: false,
    retry: 1
  });
  
  // Fetch security center data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['adminSecurityCenterDataV2'],
    queryFn: async () => {
      const response = await base44.functions.invoke('adminSecurityCenterDataV2', { 
        action: 'refresh',
        limit: 50
      });
      
      if (!response.data.ok) {
        throw new Error(response.data.error?.message || 'Erro ao carregar dados');
      }
      
      return response.data.data;
    },
    refetchInterval: false,
    retry: 1
  });
  
  // Scan mutation
  const scanMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('adminSecurityCenterDataV2', { 
        action: 'scan',
        limit: 50
      });
      
      if (!response.data.ok) {
        throw new Error(response.data.error?.message || 'Erro ao executar scan');
      }
      
      return response.data.data;
    },
    onSuccess: (result) => {
      queryClient.setQueryData(['adminSecurityCenterDataV2'], result);
      toast.success('Scan executado com sucesso');
    },
    onError: (error) => {
      toast.error(`Erro ao executar scan: ${error.message}`);
    }
  });
  
  // Handle refresh
  const handleRefresh = () => {
    refetch();
    toast.info('Atualizando dados...');
  };
  
  // Handle scan
  const handleScan = () => {
    scanMutation.mutate();
  };
  
  // P5A: Add log entry
  const addP5aLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    setP5aLogs(prev => [...prev, { timestamp, message, type }].slice(-10));
  };
  
  // P5A: Clear logs
  const clearP5aLogs = () => setP5aLogs([]);
  
  // P5A: Call adminSecurityAlert
  const callP5aAction = async (action, extraPayload = {}) => {
    setP5aLoading(true);
    addP5aLog(`Executando: ${action}...`, 'info');
    
    try {
      const response = await base44.functions.invoke('adminSecurityAlert', { 
        action, 
        ...extraPayload 
      });
      
      if (response.data.ok) {
        addP5aLog(`✅ ${action} concluído`, 'success');
        addP5aLog(JSON.stringify(response.data.data, null, 2), 'data');
        toast.success(`${action} executado com sucesso`);
      } else {
        addP5aLog(`❌ Erro: ${response.data.error?.message}`, 'error');
        toast.error(response.data.error?.message || 'Erro desconhecido');
      }
    } catch (error) {
      addP5aLog(`❌ Erro: ${error.message}`, 'error');
      toast.error(`Erro: ${error.message}`);
    } finally {
      setP5aLoading(false);
    }
  };
  
  // Filter events by severity
  const filteredEvents = data?.security_events?.items?.filter(evt => 
    severityFilter === 'all' || evt.severity === severityFilter
  ) || [];
  
  if (error) {
    return (
      <RequireAdminAuth>
        <AdminLayout>
          <div className="min-h-screen py-8 px-4">
            <div className="max-w-7xl mx-auto">
              <Card className="bg-[#0C121C] border-red-500/30">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-white mb-4">Erro ao carregar dados de segurança</p>
                    <p className="text-[#A9B2C7] text-sm mb-4">{error.message}</p>
                    <Button onClick={handleRefresh} variant="outline">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Tentar Novamente
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </AdminLayout>
      </RequireAdminAuth>
    );
  }
  
  return (
    <RequireAdminAuth>
      <AdminLayout>
        <div className="min-h-screen py-8 px-4">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Shield className="w-8 h-8 text-[#19E0FF]" />
                  Centro de Segurança
                </h1>
                <p className="text-[#A9B2C7] mt-1">
                  Visibilidade operacional do hardening e sinais de abuso
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  variant="outline"
                  className="border-[#19E0FF]/30 text-[#19E0FF] hover:bg-[#19E0FF]/10"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
                
                <Button
                  onClick={handleScan}
                  disabled={scanMutation.isPending || isLoading}
                  className="bg-gradient-to-r from-[#FF4B6A] to-[#8B0000] text-white hover:opacity-90"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Executar Scan Agora
                </Button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {[1,2,3,4].map(i => (
                  <Card key={i} className="bg-[#0C121C] border-[#19E0FF]/10">
                    <CardContent className="pt-6">
                      <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-[#19E0FF]/10 rounded w-1/3"></div>
                        <div className="h-20 bg-[#19E0FF]/10 rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                {/* Go-Live Checklist */}
                <Card className="bg-[#0C121C] border-[#19E0FF]/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <ListChecks className="w-5 h-5 text-[#19E0FF]" />
                      Checklist de Go-Live (Alertas P5A/P5B)
                    </CardTitle>
                    <CardDescription className="text-[#A9B2C7]">
                      Verifique se todos os pré-requisitos estão configurados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {goLiveLoading ? (
                      <div className="animate-pulse space-y-2">
                        <div className="h-10 bg-[#19E0FF]/10 rounded"></div>
                        <div className="h-10 bg-[#19E0FF]/10 rounded"></div>
                        <div className="h-10 bg-[#19E0FF]/10 rounded"></div>
                      </div>
                    ) : goLiveStatus ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="flex items-center justify-between p-3 bg-[#05070B] rounded-lg">
                            <span className="text-[#A9B2C7]">E-mail configurado</span>
                            {goLiveStatus.email_configured ? (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                OK
                              </Badge>
                            ) : (
                              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                                <XCircle className="w-3 h-3 mr-1" />
                                FALTANDO
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-[#05070B] rounded-lg">
                            <span className="text-[#A9B2C7]">Discord configurado</span>
                            {goLiveStatus.discord_configured ? (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                OK
                              </Badge>
                            ) : (
                              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                                <XCircle className="w-3 h-3 mr-1" />
                                FALTANDO
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-[#05070B] rounded-lg">
                            <span className="text-[#A9B2C7]">Canais ativos</span>
                            <span className="text-white text-sm font-mono">
                              {goLiveStatus.channels?.join(', ') || 'nenhum'}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-[#05070B] rounded-lg">
                            <span className="text-[#A9B2C7]">CRON_SECRET configurado</span>
                            {goLiveStatus.cron_secret_configured ? (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                OK
                              </Badge>
                            ) : (
                              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                                <XCircle className="w-3 h-3 mr-1" />
                                FALTANDO
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {(!goLiveStatus.email_configured || !goLiveStatus.discord_configured) && (
                          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                            <h4 className="text-yellow-400 font-semibold mb-2">⚠️ Configuração Necessária</h4>
                            <div className="text-[#A9B2C7] text-sm space-y-1">
                              {goLiveStatus.guidance?.steps_ptbr?.map((step, idx) => (
                                <p key={idx}>• {step}</p>
                              ))}
                            </div>
                            <div className="mt-3 pt-3 border-t border-yellow-500/30">
                              <p className="text-yellow-400 text-xs font-semibold mb-1">Variáveis necessárias:</p>
                              <div className="flex flex-wrap gap-2">
                                {goLiveStatus.guidance?.env_names?.map(envName => (
                                  <code key={envName} className="bg-[#05070B] text-[#19E0FF] px-2 py-1 rounded text-xs">
                                    {envName}
                                  </code>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {goLiveStatus.email_configured && goLiveStatus.discord_configured && (
                          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                            <h4 className="text-green-400 font-semibold mb-2">✅ Pronto para Testes</h4>
                            <p className="text-[#A9B2C7] text-sm">
                              Todos os canais estão configurados. Use os botões abaixo para testar cada canal individualmente.
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <XCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
                        <p className="text-white text-sm">Erro ao carregar checklist</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Environment Variables */}
                <Card className="bg-[#0C121C] border-[#19E0FF]/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Lock className="w-5 h-5 text-[#19E0FF]" />
                      Variáveis de Ambiente
                    </CardTitle>
                    <CardDescription className="text-[#A9B2C7]">
                      Status das variáveis críticas (apenas presença, sem valores)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-white font-semibold mb-2">Obrigatórias</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {data?.env?.required?.map(env => (
                            <div key={env.name} className="flex items-center justify-between p-3 bg-[#05070B] rounded-lg">
                              <span className="text-[#A9B2C7] font-mono text-sm">{env.name}</span>
                              {env.present ? (
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Presente
                                </Badge>
                              ) : (
                                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Ausente
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-white font-semibold mb-2">Opcionais</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {data?.env?.optional?.map(env => (
                            <div key={env.name} className="flex items-center justify-between p-3 bg-[#05070B] rounded-lg">
                              <span className="text-[#A9B2C7] font-mono text-sm">{env.name}</span>
                              {env.present ? (
                                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Presente
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-[#A9B2C7]/30 text-[#A9B2C7]">
                                  Ausente
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Exposure Scan */}
                <Card className="bg-[#0C121C] border-[#19E0FF]/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Eye className="w-5 h-5 text-[#19E0FF]" />
                      Exposure Scan
                      {data?.exposure_scan?.status && (
                        <Badge className={
                          data.exposure_scan.status === 'critical' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                          data.exposure_scan.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                          'bg-green-500/20 text-green-400 border-green-500/30'
                        }>
                          {data.exposure_scan.status.toUpperCase()}
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-[#A9B2C7]">
                      Scan de exposição pública de dados sensíveis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {data?.exposure_scan?.findings?.length > 0 ? (
                      <div className="space-y-2">
                        {data.exposure_scan.findings.map((finding, idx) => (
                          <div key={idx} className={`p-3 rounded-lg border ${
                            finding.severity === 'high' ? 'bg-red-500/10 border-red-500/30' :
                            finding.severity === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30' :
                            'bg-blue-500/10 border-blue-500/30'
                          }`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-white font-mono text-sm">{finding.key}</span>
                                  <Badge variant="outline" className={
                                    finding.severity === 'high' ? 'border-red-500/50 text-red-400' :
                                    finding.severity === 'medium' ? 'border-yellow-500/50 text-yellow-400' :
                                    'border-blue-500/50 text-blue-400'
                                  }>
                                    {finding.severity}
                                  </Badge>
                                </div>
                                <p className="text-[#A9B2C7] text-sm">{finding.message}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                        <p className="text-white">Nenhuma exposição detectada</p>
                        <p className="text-[#A9B2C7] text-sm">Todos os checks passaram com sucesso</p>
                      </div>
                    )}
                    
                    {data?.exposure_scan?.summary && (
                      <div className="mt-4 pt-4 border-t border-[#19E0FF]/10">
                        <div className="grid grid-cols-4 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-red-400">{data.exposure_scan.summary.critical}</div>
                            <div className="text-xs text-[#A9B2C7]">Críticos</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-green-400">{data.exposure_scan.summary.ok}</div>
                            <div className="text-xs text-[#A9B2C7]">OK</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-yellow-400">{data.exposure_scan.summary.unknown}</div>
                            <div className="text-xs text-[#A9B2C7]">Unknown</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-[#19E0FF]">{data.exposure_scan.summary.total}</div>
                            <div className="text-xs text-[#A9B2C7]">Total</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {data?.exposure_scan?.scanned_at && (
                      <p className="text-[#A9B2C7] text-xs mt-2">
                        <Clock className="w-3 h-3 inline mr-1" />
                        Último scan: {new Date(data.exposure_scan.scanned_at).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </CardContent>
                </Card>
                
                {/* Rate Limits */}
                <Card className="bg-[#0C121C] border-[#19E0FF]/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Activity className="w-5 h-5 text-[#19E0FF]" />
                      Rate Limiting
                    </CardTitle>
                    <CardDescription className="text-[#A9B2C7]">
                      Buckets ativos e principais infratores
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-[#05070B] rounded-lg">
                        <span className="text-[#A9B2C7]">Buckets Ativos</span>
                        <span className="text-2xl font-bold text-[#19E0FF]">
                          {data?.rate_limits?.summary?.active_buckets || 0}
                        </span>
                      </div>
                      
                      {data?.rate_limits?.summary?.top_keys?.length > 0 && (
                        <div>
                          <h3 className="text-white font-semibold mb-2">Top Offenders</h3>
                          <div className="space-y-2">
                            {data.rate_limits.summary.top_keys.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between p-3 bg-[#05070B] rounded-lg">
                                <span className="text-[#A9B2C7] font-mono text-sm">{item.key}</span>
                                <div className="flex items-center gap-3">
                                  <Badge variant="outline" className="border-[#19E0FF]/30 text-[#19E0FF]">
                                    {item.hits} hits
                                  </Badge>
                                  {item.blocked_until && (
                                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                                      Bloqueado
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                {/* P5A Email Alerts Panel */}
                <Card className="bg-[#0C121C] border-[#19E0FF]/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Mail className="w-5 h-5 text-[#19E0FF]" />
                      Alertas por E-mail (P5A)
                    </CardTitle>
                    <CardDescription className="text-[#A9B2C7]">
                      Sistema automatizado de notificação de eventos críticos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => callP5aAction('status')}
                          disabled={p5aLoading}
                          variant="outline"
                          className="border-[#19E0FF]/30 text-[#19E0FF] hover:bg-[#19E0FF]/10"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver Status
                        </Button>
                        
                        <Button
                          onClick={() => callP5aAction('sendTestEmail')}
                          disabled={p5aLoading}
                          variant="outline"
                          className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Testar E-mail
                        </Button>
                        
                        <Button
                          onClick={() => callP5aAction('sendTestDiscord')}
                          disabled={p5aLoading}
                          variant="outline"
                          className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Testar Discord
                        </Button>
                        
                        <Button
                          onClick={() => callP5aAction('seedTestCriticalEvent')}
                          disabled={p5aLoading}
                          variant="outline"
                          className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Criar Evento Crítico
                        </Button>
                        
                        <Button
                          onClick={() => callP5aAction('runDispatchNow')}
                          disabled={p5aLoading}
                          className="bg-gradient-to-r from-red-500 to-red-700 text-white hover:opacity-90 col-span-2"
                        >
                          <PlayCircle className="w-4 h-4 mr-2" />
                          Disparar Alerta Agora (Todos os Canais)
                        </Button>
                      </div>
                      
                      {p5aLogs.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-white text-sm font-semibold">Logs</h3>
                            <Button
                              onClick={clearP5aLogs}
                              size="sm"
                              variant="ghost"
                              className="text-[#A9B2C7] text-xs"
                            >
                              Limpar
                            </Button>
                          </div>
                          <div className="bg-[#05070B] rounded-lg p-3 max-h-60 overflow-y-auto font-mono text-xs space-y-1">
                            {p5aLogs.map((log, idx) => (
                              <div 
                                key={idx} 
                                className={
                                  log.type === 'success' ? 'text-green-400' :
                                  log.type === 'error' ? 'text-red-400' :
                                  log.type === 'data' ? 'text-[#19E0FF] whitespace-pre-wrap' :
                                  'text-[#A9B2C7]'
                                }
                              >
                                {log.type === 'data' ? log.message : `[${log.timestamp}] ${log.message}`}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-1 text-xs text-[#A9B2C7]">
                        <p>💡 <strong>Email:</strong> Configure SECURITY_ALERT_EMAIL_TO</p>
                        <p>💡 <strong>Discord:</strong> Configure SECURITY_ALERT_DISCORD_WEBHOOK_URL</p>
                        <p>💡 <strong>Canais:</strong> Configure SECURITY_ALERT_CHANNELS (padrão: "email")</p>
                        <p className="text-[#19E0FF] text-xs mt-2">
                          Todas as configurações em: Dashboard → Settings → Environment Variables
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Security Events */}
                <Card className="bg-[#0C121C] border-[#19E0FF]/20 lg:col-span-2">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-white flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-[#19E0FF]" />
                          Security Events (últimos {data?.security_events?.limit || 50})
                        </CardTitle>
                        <CardDescription className="text-[#A9B2C7]">
                          Logs forenses de eventos de segurança
                        </CardDescription>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-[#A9B2C7]" />
                        <select
                          value={severityFilter}
                          onChange={(e) => setSeverityFilter(e.target.value)}
                          className="bg-[#05070B] text-white border border-[#19E0FF]/30 rounded px-3 py-1 text-sm"
                        >
                          <option value="all">Todos</option>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {filteredEvents.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[#19E0FF]/10">
                              <th className="text-left py-2 px-3 text-[#A9B2C7]">Data</th>
                              <th className="text-left py-2 px-3 text-[#A9B2C7]">Severidade</th>
                              <th className="text-left py-2 px-3 text-[#A9B2C7]">Tipo</th>
                              <th className="text-left py-2 px-3 text-[#A9B2C7]">Actor</th>
                              <th className="text-left py-2 px-3 text-[#A9B2C7]">IP Hash</th>
                              <th className="text-left py-2 px-3 text-[#A9B2C7]">Rota</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredEvents.map((evt) => (
                              <tr key={evt.id} className="border-b border-[#19E0FF]/5 hover:bg-[#05070B]">
                                <td className="py-2 px-3 text-[#A9B2C7] text-xs">
                                  {new Date(evt.created_date).toLocaleString('pt-BR')}
                                </td>
                                <td className="py-2 px-3">
                                  <Badge className={
                                    evt.severity === 'critical' || evt.severity === 'high' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                    evt.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                    'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                  }>
                                    {evt.severity}
                                  </Badge>
                                </td>
                                <td className="py-2 px-3 text-white font-mono text-xs">{evt.event_type}</td>
                                <td className="py-2 px-3 text-[#A9B2C7]">{evt.actor_type}</td>
                                <td className="py-2 px-3 text-[#A9B2C7] font-mono text-xs">{evt.ip_hash || '-'}</td>
                                <td className="py-2 px-3 text-[#A9B2C7]">{evt.route || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                        <p className="text-white">Nenhum evento encontrado</p>
                        <p className="text-[#A9B2C7] text-sm">
                          {severityFilter !== 'all' ? `Sem eventos de severidade "${severityFilter}"` : 'Sistema limpo'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </AdminLayout>
    </RequireAdminAuth>
  );
}