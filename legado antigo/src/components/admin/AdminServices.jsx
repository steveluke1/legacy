import React, { useState, useEffect } from 'react';
import { Shield, Ban, CheckCircle, Search, FileText, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import GlowCard from '@/components/ui/GlowCard';
import MetalButton from '@/components/ui/MetalButton';
import SeedDemoButton from '@/components/admin/SeedDemoButton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const statusLabels = {
  'ACTIVE': { label: 'Ativo', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  'PAUSED': { label: 'Pausado', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  'BANNED': { label: 'Banido', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  'PENDING_PAYMENT': { label: 'Aguardando Pagamento', color: 'bg-yellow-500/20 text-yellow-400' },
  'PAID': { label: 'Pago', color: 'bg-blue-500/20 text-blue-400' },
  'IN_PROGRESS': { label: 'Em Andamento', color: 'bg-purple-500/20 text-purple-400' },
  'COMPLETED': { label: 'Concluído', color: 'bg-green-500/20 text-green-400' },
  'CANCELLED': { label: 'Cancelado', color: 'bg-gray-500/20 text-gray-400' },
  'DISPUTE_OPEN': { label: 'Em Disputa', color: 'bg-red-500/20 text-red-400' },
  'DISPUTE_RESOLVED': { label: 'Disputa Resolvida', color: 'bg-green-500/20 text-green-400' }
};

export default function AdminServices() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offers, setOffers] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('offers');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const offersData = await base44.entities.ServiceOffer.list(null, 100);
      setOffers(offersData || []);

      const contractsData = await base44.entities.ServiceContract.list(null, 100);
      setContracts(contractsData || []);

      const logsData = await base44.entities.ServiceContractLog.list('-created_date', 50);
      setLogs(logsData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBanOffer = async (offerId) => {
    if (!confirm('Tem certeza que deseja banir esta oferta?')) return;

    try {
      const response = await base44.functions.invoke('admin_banServiceOffer', {
        offer_id: offerId,
        reason: 'Banido por administrador'
      });

      if (response.data && response.data.success) {
        toast.success('Oferta banida com sucesso');
        await loadData();
      } else {
        toast.error('Erro ao banir oferta');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao banir oferta');
    }
  };

  const handleResolveDispute = async (contractId) => {
    const notes = prompt('Digite suas observações sobre a resolução:');
    if (!notes) return;

    try {
      const response = await base44.functions.invoke('admin_resolveDispute', {
        contract_id: contractId,
        resolution_notes: notes
      });

      if (response.data && response.data.success) {
        toast.success('Disputa resolvida com sucesso');
        await loadData();
      } else {
        toast.error('Erro ao resolver disputa');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao resolver disputa');
    }
  };

  const filteredOffers = offers.filter(offer =>
    offer.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredContracts = contracts.filter(contract =>
    contract.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div>
        <Skeleton className="h-12 w-64 bg-[#19E0FF]/10 mb-8" />
        <Skeleton className="h-96 w-full bg-[#19E0FF]/10" />
        <p className="text-center text-[#A9B2C7] text-sm mt-4">Carregando serviços...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-16 h-16 text-[#FF4B6A] mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Erro ao carregar serviços</h3>
        <p className="text-[#A9B2C7] mb-6">{error}</p>
        <Button
          onClick={loadData}
          className="bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] text-[#05070B] font-bold"
        >
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Administração de Serviços</h2>

      <div className="mb-6">
        <SeedDemoButton />
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A9B2C7]" />
          <Input
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#0C121C] border-[#19E0FF]/20 text-white"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-[#0C121C] p-1 rounded-xl mb-8">
          <TabsTrigger value="offers">Ofertas ({offers.length})</TabsTrigger>
          <TabsTrigger value="contracts">Contratos ({contracts.length})</TabsTrigger>
          <TabsTrigger value="logs">Logs ({logs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="offers">
          <GlowCard className="p-6">
            <div className="space-y-4">
              {filteredOffers.map((offer) => (
                <div key={offer.id} className="p-4 bg-[#05070B] rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-white font-bold mb-1">{offer.title}</h3>
                      <p className="text-[#A9B2C7] text-sm line-clamp-2">{offer.description}</p>
                    </div>
                    <Badge className={statusLabels[offer.status]?.color}>
                      {statusLabels[offer.status]?.label}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-[#A9B2C7]">
                      Categoria: <span className="text-white">{offer.category}</span>
                    </div>
                    {offer.status !== 'BANNED' && (
                      <MetalButton
                        variant="danger"
                        size="sm"
                        onClick={() => handleBanOffer(offer.id)}
                      >
                        <Ban className="w-4 h-4 mr-1" />
                        Banir
                      </MetalButton>
                    )}
                  </div>
                </div>
              ))}

              {filteredOffers.length === 0 && (
                <div className="text-center py-12">
                  <Shield className="w-16 h-16 text-[#A9B2C7]/30 mx-auto mb-4" />
                  <p className="text-[#A9B2C7]">Nenhuma oferta encontrada</p>
                </div>
              )}
            </div>
          </GlowCard>
        </TabsContent>

        <TabsContent value="contracts">
          <GlowCard className="p-6">
            <div className="space-y-4">
              {filteredContracts.map((contract) => (
                <div key={contract.id} className="p-4 bg-[#05070B] rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-white font-bold mb-1">Contrato #{contract.id.slice(0, 8)}</h3>
                      <p className="text-[#A9B2C7] text-sm">
                        Tipo de pagamento: <span className="text-white">{contract.payment_type}</span>
                      </p>
                    </div>
                    <Badge className={statusLabels[contract.status]?.color}>
                      {statusLabels[contract.status]?.label}
                    </Badge>
                  </div>

                  {contract.status === 'DISPUTE_OPEN' && (
                    <MetalButton
                      variant="primary"
                      size="sm"
                      onClick={() => handleResolveDispute(contract.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Resolver Disputa
                    </MetalButton>
                  )}
                </div>
              ))}

              {filteredContracts.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-[#A9B2C7]/30 mx-auto mb-4" />
                  <p className="text-[#A9B2C7]">Nenhum contrato encontrado</p>
                </div>
              )}
            </div>
          </GlowCard>
        </TabsContent>

        <TabsContent value="logs">
          <GlowCard className="p-6">
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="p-3 bg-[#05070B] rounded-lg text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#19E0FF] font-medium">{log.action_type}</span>
                    <span className="text-[#A9B2C7] text-xs">
                      {new Date(log.created_date).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-white">{log.message}</p>
                  {log.previous_status && (
                    <p className="text-[#A9B2C7] text-xs mt-1">
                      {log.previous_status} → {log.new_status}
                    </p>
                  )}
                </div>
              ))}

              {logs.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-[#A9B2C7]/30 mx-auto mb-4" />
                  <p className="text-[#A9B2C7]">Nenhum log encontrado</p>
                </div>
              )}
            </div>
          </GlowCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}