import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, BarChart3, DollarSign, FileText, Package, Scale, Settings, ShoppingBag, Activity, RefreshCw } from 'lucide-react';
import RequireAdminAuth from '@/components/admin/RequireAdminAuth';
import { useAdminAuth } from '@/components/admin/AdminAuthProvider';
import AdminCash from '@/components/admin/AdminCash';
import AdminOverview from '@/components/admin/AdminOverview';
import AdminLogs from '@/components/admin/AdminLogs';
import AdminMarket from '@/components/admin/AdminMarket';
import AdminDisputes from '@/components/admin/AdminDisputes';
import AdminServices from '@/components/admin/AdminServices';
import AdminEnquetes from '@/components/admin/AdminEnquetes';
import AdminStoreSales from '@/components/admin/AdminStoreSales';
import AdminFunil from '@/components/admin/AdminFunil';
import AdminLojaCash from '@/components/admin/AdminLojaCash';
import AdminDiagnostics from '@/components/admin/AdminDiagnostics';
import AdminWeeklyRankings from '@/components/admin/AdminWeeklyRankings';
import AdminMegaSeed from '@/components/admin/AdminMegaSeed';
import AdminSystemSweep from '@/components/admin/AdminSystemSweep';
import RBACConfigGuide from '@/components/admin/RBACConfigGuide';
import AdminMarketplace from '@/components/admin/AdminMarketplace';
import FinalIntegrityReport from '@/components/admin/FinalIntegrityReport';
import ProductionReadinessChecklist from '@/components/admin/PRODUCTION_READINESS_CHECKLIST';
import ExecutiveSummary from '@/components/admin/ExecutiveSummary';
import RelatórioProduçãoFinalPTBR from '@/components/admin/RELATORIO_PRODUCAO_FINAL_PT_BR';
import SecurityHardeningReport from '@/components/admin/SecurityHardeningReport';
import E2ETestSuite from '@/components/admin/E2ETestSuite';
import IdempotencyAudit from '@/components/admin/IdempotencyAudit';
import FinalProductionDecision from '@/components/admin/FinalProductionDecision';
import ProductionChecklistInteractive from '@/components/admin/ProductionChecklistInteractive';
import SystemMonitoring from '@/components/admin/SystemMonitoring';
import AdminMarketplaceEfiVerifier from '@/components/admin/AdminMarketplaceEfiVerifier';
import FinalExecutiveReport from '@/components/admin/FinalExecutiveReport';
import EfiHealthPanel from '@/components/admin/EfiHealthPanel';
import DeploymentVerifier from '@/components/admin/DeploymentVerifier';
import ProductionGoNoGoDecision from '@/components/admin/ProductionGoNoGoDecision';
import AdminSecurityCenter from '@/pages/AdminSecurityCenter';
import AdminMarketReconcile from '@/components/admin/AdminMarketReconcile';
import { Zap, Lock, Trophy, Sparkles } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';

export default function AdminDashboard() {
  const { admin } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('decisao');

  // Listen for tab change events from child components
  React.useEffect(() => {
    const handleTabChange = (event) => {
      if (event.detail?.tab) {
        setActiveTab(event.detail.tab);
      }
    };
    window.addEventListener('changeAdminTab', handleTabChange);
    return () => window.removeEventListener('changeAdminTab', handleTabChange);
  }, []);

  const tabs = [
    { id: 'relatorio-final', name: '📊 RELATÓRIO FINAL', icon: Shield },
    { id: 'deployment', name: '🚀 Deployment', icon: Shield },
    { id: 'efi-config', name: '🎛️ EFI Config', icon: Shield },
    { id: 'verificacao-pix', name: '✅ Verificação PIX', icon: Shield },
    { id: 'reconcile', name: '🔄 Reconciliação PIX', icon: RefreshCw },
    { id: 'decisao', name: '🎯 DECISÃO FINAL', icon: Shield },
    { id: 'checklist', name: '✅ Checklist Produção', icon: Shield },
    { id: 'monitoring', name: '📊 Monitoramento', icon: Activity },
    { id: 'security', name: '🔒 Security', icon: Lock },
    { id: 'security-center', name: '🛡️ Centro de Segurança', icon: Shield },
    { id: 'idempotency', name: '🔄 Idempotência', icon: Zap },
    { id: 'e2e', name: '🧪 E2E Tests', icon: Activity },
    { id: 'sumario', name: '📊 Sumário', icon: Shield },
    { id: 'producao', name: '📄 Produção', icon: FileText },
    { id: 'overview', name: 'Visão Geral', icon: Shield },

    { id: 'diagnostico', name: 'Diagnóstico', icon: Activity },
    { id: 'funil', name: 'Funil', icon: BarChart3 },
    { id: 'cash', name: 'CASH', icon: DollarSign },
    { id: 'vendas', name: 'Vendas Loja', icon: Package },
    { id: 'loja-cash', name: 'Loja Cash', icon: ShoppingBag },
    { id: 'marketplace-alz', name: 'Marketplace ALZ', icon: Scale },
    { id: 'mercado', name: 'Mercado RMT', icon: Scale },
    { id: 'disputas', name: 'Disputas', icon: Settings },
    { id: 'servicos', name: 'Serviços', icon: Settings },
    { id: 'enquetes', name: 'Enquetes', icon: BarChart3 },
    { id: 'premiacoes', name: '🏆 Premiações', icon: Trophy },
    { id: 'mega-seed', name: '🎲 Mega Seed', icon: Sparkles },
    { id: 'sweep', name: '🧹 System Sweep', icon: Settings },
    { id: 'logs', name: 'Logs', icon: FileText }
  ];

  return (
    <RequireAdminAuth>
      <AdminLayout>
        <div className="min-h-screen py-8 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-[#FF4B6A] to-[#8B0000] rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">Painel Administrativo</h1>
                  <p className="text-[#A9B2C7]">Bem-vindo, {admin?.username}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center gap-2 px-4 py-3 rounded-lg whitespace-nowrap transition-all
                      ${activeTab === tab.id 
                        ? 'bg-gradient-to-r from-[#FF4B6A] to-[#8B0000] text-white shadow-lg' 
                        : 'bg-[#0C121C] text-[#A9B2C7] hover:text-white border border-[#19E0FF]/10'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.name}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'relatorio-final' && <FinalExecutiveReport />}
              {activeTab === 'deployment' && <DeploymentVerifier />}
              {activeTab === 'efi-config' && <EfiHealthPanel />}
              {activeTab === 'verificacao-pix' && <AdminMarketplaceEfiVerifier />}
              {activeTab === 'reconcile' && <AdminMarketReconcile />}
              {activeTab === 'decisao' && <ProductionGoNoGoDecision />}
              {activeTab === 'checklist' && <ProductionChecklistInteractive />}
              {activeTab === 'monitoring' && <SystemMonitoring />}
              {activeTab === 'sumario' && <ExecutiveSummary />}
              {activeTab === 'producao' && <RelatórioProduçãoFinalPTBR />}
              {activeTab === 'security' && <SecurityHardeningReport />}
              {activeTab === 'security-center' && <AdminSecurityCenter />}
              {activeTab === 'idempotency' && <IdempotencyAudit />}
              {activeTab === 'e2e' && <E2ETestSuite />}
              {activeTab === 'overview' && <AdminOverview />}
              {activeTab === 'diagnostico' && <AdminDiagnostics />}
              {activeTab === 'funil' && <AdminFunil />}
              {activeTab === 'cash' && <AdminCash />}
              {activeTab === 'vendas' && <AdminStoreSales />}
              {activeTab === 'loja-cash' && <AdminLojaCash />}
              {activeTab === 'marketplace-alz' && <AdminMarketplace />}
              {activeTab === 'mercado' && <AdminMarket />}
              {activeTab === 'disputas' && <AdminDisputes />}
              {activeTab === 'servicos' && <AdminServices />}
              {activeTab === 'enquetes' && <AdminEnquetes />}
              {activeTab === 'premiacoes' && <AdminWeeklyRankings />}
              {activeTab === 'mega-seed' && <AdminMegaSeed />}
              {activeTab === 'sweep' && <AdminSystemSweep />}
              {activeTab === 'logs' && <AdminLogs />}
            </motion.div>
          </div>
        </div>
      </AdminLayout>
    </RequireAdminAuth>
  );
}