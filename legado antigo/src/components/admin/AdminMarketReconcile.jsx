import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, XCircle, Play, Wrench, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminMarketReconcile() {
  const [reconciling, setReconciling] = useState(false);
  const [report, setReport] = useState(null);
  const [failedPayments, setFailedPayments] = useState([]);
  const [loadingFailed, setLoadingFailed] = useState(false);
  const [testingSplit, setTestingSplit] = useState(false);
  const [splitTestReport, setSplitTestReport] = useState(null);
  const [runningDiagnostics, setRunningDiagnostics] = useState(false);
  const [diagnosticsReport, setDiagnosticsReport] = useState(null);

  const handleReconcile = async (dryRun = true) => {
    setReconciling(true);
    try {
      const res = await base44.functions.invoke('marketReconcilePayments', { dryRun });
      
      if (res.data?.ok) {
        setReport(res.data.data);
        toast.success(dryRun ? 'Simulação concluída' : 'Reconciliação aplicada!');
      } else {
        toast.error(res.data?.error?.message || 'Erro ao reconciliar');
      }
    } catch (error) {
      toast.error('Erro ao reconciliar pagamentos');
      console.error(error);
    } finally {
      setReconciling(false);
    }
  };

  const handleLoadFailedPayments = async () => {
    setLoadingFailed(true);
    try {
      const res = await base44.functions.invoke('marketListFailedPayments', {});
      
      if (res.data?.ok) {
        setFailedPayments(res.data.data.payments || []);
      } else {
        toast.error('Erro ao carregar pagamentos');
      }
    } catch (error) {
      toast.error('Erro ao carregar');
      console.error(error);
    } finally {
      setLoadingFailed(false);
    }
  };

  const handleRetrySettlement = async (paymentId) => {
    try {
      const res = await base44.functions.invoke('marketRetrySettlement', { paymentId });
      
      if (res.data?.ok) {
        toast.success('Settlement retentado com sucesso!');
        handleLoadFailedPayments(); // Reload list
      } else {
        toast.error(res.data?.error?.message || 'Erro ao retentar');
      }
    } catch (error) {
      toast.error('Erro ao retentar settlement');
      console.error(error);
    }
  };

  const handleTestSplit = async (cleanupFirst = false) => {
    setTestingSplit(true);
    setSplitTestReport(null);
    
    try {
      const res = await base44.functions.invoke('marketSplitE2eTest', { cleanupFirst });
      
      if (res.data) {
        setSplitTestReport(res.data);
        
        if (res.data.ok || res.data.data?.overall_status === 'success') {
          toast.success('Teste Split E2E concluído com sucesso!');
        } else {
          toast.error('Teste Split falhou. Veja o relatório.');
        }
      } else {
        toast.error('Erro ao executar teste');
      }
    } catch (error) {
      toast.error('Erro ao executar teste Split');
      console.error(error);
    } finally {
      setTestingSplit(false);
    }
  };

  const handleBridgeDiagnostics = async () => {
    setRunningDiagnostics(true);
    setDiagnosticsReport(null);
    
    try {
      const res = await base44.functions.invoke('marketDiagnostics', {});
      
      if (res.data) {
        setDiagnosticsReport(res.data);
        
        if (res.data.ok && res.data.data?.overall_status === 'success') {
          toast.success('Diagnóstico Bridge: todos endpoints disponíveis!');
        } else if (res.data.data?.overall_status === 'degraded') {
          toast.warning('Diagnóstico Bridge: alguns endpoints indisponíveis');
        } else {
          toast.error('Diagnóstico Bridge falhou');
        }
      } else {
        toast.error('Erro ao executar diagnóstico');
      }
    } catch (error) {
      toast.error('Erro ao executar diagnóstico Bridge');
      console.error(error);
    } finally {
      setRunningDiagnostics(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Reconciliação de Pagamentos</h2>
      </div>

      {/* Bridge Diagnostics */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-bold mb-4">🔍 Diagnóstico Bridge (Endpoints)</h3>
        <div className="flex gap-3">
          <Button onClick={handleBridgeDiagnostics} disabled={runningDiagnostics}>
            <Play className="w-4 h-4 mr-2" />
            Executar Diagnóstico
          </Button>
        </div>
        <p className="text-sm text-gray-600 mt-3">
          Testa conectividade e disponibilidade dos endpoints críticos do Bridge Node 
          (resolve-nic, check-online, alz/settle).
        </p>
      </div>

      {/* Bridge Diagnostics Report */}
      {diagnosticsReport && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="font-bold mb-4">Relatório Diagnóstico Bridge</h3>
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span>Status Geral:</span>
              <span className={`font-bold ${
                diagnosticsReport.data?.overall_status === 'success' ? 'text-green-600' :
                diagnosticsReport.data?.overall_status === 'degraded' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {diagnosticsReport.data?.overall_status?.toUpperCase() || 'ERROR'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Bridge URL:</span>
              <span className="font-mono text-xs">{diagnosticsReport.data?.bridge_config?.base_url || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>API Key:</span>
              <span className="font-mono text-xs">{diagnosticsReport.data?.bridge_config?.api_key || 'N/A'}</span>
            </div>
          </div>
          
          {diagnosticsReport.data?.endpoints && (
            <div className="space-y-2 max-h-96 overflow-auto">
              {diagnosticsReport.data.endpoints.map((endpoint, idx) => (
                <div key={idx} className={`p-3 rounded text-sm ${
                  endpoint.status === 'available' ? 'bg-green-50' :
                  endpoint.status === 'unavailable' ? 'bg-red-50' :
                  'bg-gray-50'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {endpoint.status === 'available' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                    {endpoint.status === 'unavailable' && <XCircle className="w-4 h-4 text-red-600" />}
                    {endpoint.status === 'error' && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
                    <span className="font-semibold">{endpoint.method} {endpoint.name}</span>
                    {endpoint.http_status && (
                      <span className="text-xs text-gray-500 ml-auto">HTTP {endpoint.http_status}</span>
                    )}
                  </div>
                  {endpoint.error_code && (
                    <div className="text-xs text-red-600 mt-1">
                      <strong>Code:</strong> {endpoint.error_code}
                    </div>
                  )}
                  {endpoint.error_message && (
                    <div className="text-xs text-red-600 mt-1">{endpoint.error_message}</div>
                  )}
                  {endpoint.next_action && (
                    <div className="text-xs text-orange-600 mt-1">
                      <strong>Next Action:</strong> {endpoint.next_action}
                    </div>
                  )}
                  {endpoint.note && (
                    <div className="text-xs text-gray-500 mt-1 italic">{endpoint.note}</div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {diagnosticsReport.data?.missing_endpoints && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700 mt-4">
              <strong>Endpoints Críticos Faltando:</strong>
              <ul className="list-disc list-inside mt-1">
                {diagnosticsReport.data.missing_endpoints.map((ep, idx) => (
                  <li key={idx}>{ep}</li>
                ))}
              </ul>
            </div>
          )}
          
          {diagnosticsReport.error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
              <strong>Erro:</strong> {diagnosticsReport.error.message || diagnosticsReport.error.code}
            </div>
          )}
        </div>
      )}

      {/* Split E2E Test */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-bold mb-4">🧪 Teste Efí Split (E2E)</h3>
        <div className="flex gap-3">
          <Button onClick={() => handleTestSplit(false)} disabled={testingSplit}>
            <Play className="w-4 h-4 mr-2" />
            Executar Teste
          </Button>
          <Button onClick={() => handleTestSplit(true)} disabled={testingSplit} variant="outline">
            <Wrench className="w-4 h-4 mr-2" />
            Cleanup + Teste
          </Button>
        </div>
        <p className="text-sm text-gray-600 mt-3">
          Cria 2 vendedores de teste, cria Split Config, cria Charge Pix, e linka via vinculo endpoint. 
          Valida toda a integração Efí Split end-to-end.
        </p>
      </div>

      {/* Split Test Report */}
      {splitTestReport && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="font-bold mb-4">Relatório Teste Split</h3>
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span>Status Geral:</span>
              <span className={`font-bold ${
                splitTestReport.data?.overall_status === 'success' ? 'text-green-600' :
                splitTestReport.data?.overall_status === 'blocked' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {splitTestReport.data?.overall_status || splitTestReport.error?.code || 'ERROR'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Ambiente:</span>
              <span className="font-mono">{splitTestReport.data?.environment || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Build:</span>
              <span className="font-mono text-xs">{splitTestReport.data?.build_signature || 'N/A'}</span>
            </div>
          </div>
          
          {splitTestReport.data?.steps && (
            <div className="space-y-2 max-h-96 overflow-auto">
              {splitTestReport.data.steps.map((step, idx) => (
                <div key={idx} className="bg-gray-50 p-3 rounded text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    {step.status === 'pass' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                    {step.status === 'fail' && <XCircle className="w-4 h-4 text-red-600" />}
                    {step.status === 'warn' && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
                    {step.status === 'skip' && <span className="w-4 h-4 text-gray-400">⊝</span>}
                    {step.status === 'blocked' && <AlertTriangle className="w-4 h-4 text-orange-600" />}
                    <span className="font-semibold">{step.name}</span>
                  </div>
                  {step.error && (
                    <div className="text-xs text-red-600 mt-1 font-mono">{step.error}</div>
                  )}
                  {step.reason && (
                    <div className="text-xs text-gray-600 mt-1">{step.reason}</div>
                  )}
                  {step.split_config_id && (
                    <div className="text-xs text-green-700 mt-1">Split Config ID: {step.split_config_id}</div>
                  )}
                  {step.txid && (
                    <div className="text-xs text-blue-700 mt-1">TXID: {step.txid}</div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {splitTestReport.error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
              <strong>Erro:</strong> {splitTestReport.error.message || splitTestReport.error.code}
            </div>
          )}
        </div>
      )}

      {/* Reconcile Controls */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-bold mb-4">Ações de Reconciliação</h3>
        <div className="flex gap-3">
          <Button onClick={() => handleReconcile(true)} disabled={reconciling}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Simular (Dry Run)
          </Button>
          <Button onClick={() => handleReconcile(false)} disabled={reconciling} variant="destructive">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Aplicar Reconciliação
          </Button>
        </div>
        <p className="text-sm text-gray-600 mt-3">
          Reconciliação expira pagamentos pendentes antigos e identifica pagamentos presos.
        </p>
      </div>

      {/* Reconciliation Report */}
      {report && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="font-bold mb-4">Relatório de Reconciliação</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Modo:</span>
              <span className="font-mono">{report.dry_run ? 'DRY RUN' : 'APPLIED'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Ações Detectadas:</span>
              <span className="font-bold">{report.actions?.length || 0}</span>
            </div>
          </div>
          
          {report.actions?.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold text-sm mb-2">Detalhes:</h4>
              <div className="space-y-2 max-h-96 overflow-auto">
                {report.actions.map((action, idx) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold">{action.type}</span>
                      {action.payment_id && (
                        <span className="text-gray-500">#{action.payment_id.substring(0, 8)}***</span>
                      )}
                    </div>
                    {action.new_status && (
                      <div>Status: {action.previous_status} → {action.new_status}</div>
                    )}
                    {action.recommendation && (
                      <div className="text-amber-600 mt-1">💡 {action.recommendation}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Failed Payments List */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">Pagamentos Falhados</h3>
          <Button onClick={handleLoadFailedPayments} disabled={loadingFailed} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Recarregar
          </Button>
        </div>

        {failedPayments.length === 0 && !loadingFailed && (
          <p className="text-sm text-gray-500">Nenhum pagamento falhado encontrado.</p>
        )}

        {failedPayments.length > 0 && (
          <div className="space-y-3">
            {failedPayments.map(payment => (
              <div key={payment.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="font-mono text-sm">#{payment.id.substring(0, 8)}***</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                        payment.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {payment.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">NIC:</span> {payment.buyer_nic || 'N/A'}
                      </div>
                      <div>
                        <span className="text-gray-500">CharIdx:</span> {payment.buyer_character_idx || 'N/A'}
                      </div>
                      <div>
                        <span className="text-gray-500">Valor:</span> R$ {(payment.total_brl_cents / 100).toFixed(2)}
                      </div>
                      <div>
                        <span className="text-gray-500">ALZ:</span> {(parseFloat(payment.alz_amount) / 1_000_000_000).toFixed(2)}B
                      </div>
                    </div>
                    
                    {payment.error_message && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                        {payment.error_message}
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    onClick={() => handleRetrySettlement(payment.id)}
                    size="sm"
                    variant="outline"
                  >
                    Retentar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}