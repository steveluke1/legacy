import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeftRight, Send, Inbox, User, Award, Star, Link2, X, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthProvider';
import RequireAuth from '@/components/auth/RequireAuth';
import SectionTitle from '@/components/ui/SectionTitle';
import GlowCard from '@/components/ui/GlowCard';
import MetalButton from '@/components/ui/MetalButton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import LoadingShell from '@/components/ui/LoadingShell';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export default function MinhaContaTransferencias() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [transfers, setTransfers] = useState({ sent: [], received: [] });
  const [processing, setProcessing] = useState(null);

  const [forms, setForms] = useState({
    PERSONAGEM: { target: '', notes: '' },
    COLECAO: { target: '', notes: '' },
    MERITO: { target: '', quantity: '' },
    LINK_ESTELAR: { target: '', notes: '' }
  });

  useEffect(() => {
    if (user) {
      loadTransfers();
      setLoading(false);
    }
  }, [user]);

  const loadTransfers = async () => {
    try {
      const response = await base44.functions.invoke('transfer_getOverview', {});
      if (response.data && response.data.success) {
        setTransfers({
          sent: response.data.sent || [],
          received: response.data.received || []
        });
      }
    } catch (e) {
      console.error('Erro ao carregar transferências:', e);
    }
  };

  const handleFormChange = (type, field, value) => {
    setForms(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value }
    }));
  };

  const handleSend = async (type) => {
    setProcessing(`send_${type}`);
    try {
      const form = forms[type];
      const response = await base44.functions.invoke('transfer_create', {
        type,
        target_identifier: form.target,
        quantity: type === 'MERITO' ? parseInt(form.quantity) : 1,
        notes: form.notes || ''
      });

      if (response.data && response.data.success) {
        toast.success(response.data.message);
        setForms(prev => ({
          ...prev,
          [type]: { target: '', notes: '', quantity: '' }
        }));
        await loadTransfers();
      } else {
        toast.error(response.data.error || 'Erro ao criar transferência');
      }
    } catch (e) {
      console.error('Erro:', e);
      toast.error('Erro ao processar transferência');
    } finally {
      setProcessing(null);
    }
  };

  const handleAccept = async (transferId) => {
    setProcessing(`accept_${transferId}`);
    try {
      const response = await base44.functions.invoke('transfer_accept', {
        transfer_id: transferId
      });

      if (response.data && response.data.success) {
        toast.success(response.data.message);
        await loadTransfers();
      } else {
        toast.error(response.data.error || 'Erro ao aceitar');
      }
    } catch (e) {
      console.error('Erro:', e);
      toast.error('Erro ao processar');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (transferId) => {
    setProcessing(`reject_${transferId}`);
    try {
      const response = await base44.functions.invoke('transfer_reject', {
        transfer_id: transferId
      });

      if (response.data && response.data.success) {
        toast.success(response.data.message);
        await loadTransfers();
      } else {
        toast.error(response.data.error || 'Erro ao recusar');
      }
    } catch (e) {
      console.error('Erro:', e);
      toast.error('Erro ao processar');
    } finally {
      setProcessing(null);
    }
  };

  const handleCancel = async (transferId) => {
    setProcessing(`cancel_${transferId}`);
    try {
      const response = await base44.functions.invoke('transfer_cancel', {
        transfer_id: transferId
      });

      if (response.data && response.data.success) {
        toast.success(response.data.message);
        await loadTransfers();
      } else {
        toast.error(response.data.error || 'Erro ao cancelar');
      }
    } catch (e) {
      console.error('Erro:', e);
      toast.error('Erro ao processar');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDENTE: <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">Pendente</Badge>,
      ACEITO: <Badge className="bg-green-500/20 text-green-500 border-green-500/30">Aceito</Badge>,
      RECUSADO: <Badge className="bg-red-500/20 text-red-500 border-red-500/30">Recusado</Badge>,
      CANCELADO: <Badge className="bg-gray-500/20 text-gray-500 border-gray-500/30">Cancelado</Badge>
    };
    return badges[status] || badges.PENDENTE;
  };

  const renderSection = (type, icon, title, description) => {
    const Icon = icon;
    const form = forms[type];
    const pending = transfers.received.filter(t => t.type === type && t.status === 'PENDENTE');
    const isSending = processing === `send_${type}`;

    return (
      <AccordionItem value={type}>
        <AccordionTrigger className="text-white hover:text-[#19E0FF]">
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-[#19E0FF]" />
            <span className="font-bold">{title}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-6 pt-4">
            {/* Send */}
            <div>
              <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                <Send className="w-4 h-4 text-[#19E0FF]" />
                Enviar {title}
              </h4>
              <p className="text-[#A9B2C7] text-sm mb-4">{description}</p>
              <div className="space-y-3">
                <Input
                  placeholder="Conta de destino (email ou apelido)"
                  value={form.target}
                  onChange={(e) => handleFormChange(type, 'target', e.target.value)}
                  className="bg-[#0C121C] border-[#19E0FF]/20"
                />
                {type === 'MERITO' ? (
                  <Input
                    type="number"
                    placeholder="Quantidade de Mérito"
                    value={form.quantity}
                    onChange={(e) => handleFormChange(type, 'quantity', e.target.value)}
                    className="bg-[#0C121C] border-[#19E0FF]/20"
                  />
                ) : (
                  <Textarea
                    placeholder={`Observações (${type === 'PERSONAGEM' ? 'nome do personagem' : 'descrição'})`}
                    value={form.notes}
                    onChange={(e) => handleFormChange(type, 'notes', e.target.value)}
                    className="bg-[#0C121C] border-[#19E0FF]/20"
                  />
                )}
                <MetalButton
                  onClick={() => handleSend(type)}
                  disabled={isSending || !form.target}
                  loading={isSending}
                  className="w-full"
                >
                  Enviar {title}
                </MetalButton>
              </div>
            </div>

            {/* Receive */}
            <div>
              <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                <Inbox className="w-4 h-4 text-[#19E0FF]" />
                Receber {title}
              </h4>
              {pending.length > 0 ? (
                <div className="space-y-3">
                  {pending.map(transfer => (
                    <GlowCard key={transfer.id} className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-white font-bold">De: {transfer.from_username}</p>
                            {type === 'MERITO' && (
                              <p className="text-[#A9B2C7] text-sm">Quantidade: {transfer.quantity} Mérito</p>
                            )}
                            {transfer.notes && (
                              <p className="text-[#A9B2C7] text-sm">{transfer.notes}</p>
                            )}
                            <p className="text-[#A9B2C7] text-xs mt-1">
                              {new Date(transfer.created_date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          {getStatusBadge(transfer.status)}
                        </div>
                        <div className="flex gap-2">
                          <MetalButton
                            onClick={() => handleAccept(transfer.id)}
                            disabled={processing === `accept_${transfer.id}`}
                            loading={processing === `accept_${transfer.id}`}
                            size="sm"
                            className="flex-1"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Aceitar
                          </MetalButton>
                          <MetalButton
                            onClick={() => handleReject(transfer.id)}
                            disabled={processing === `reject_${transfer.id}`}
                            loading={processing === `reject_${transfer.id}`}
                            size="sm"
                            variant="danger"
                            className="flex-1"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Recusar
                          </MetalButton>
                        </div>
                      </div>
                    </GlowCard>
                  ))}
                </div>
              ) : (
                <p className="text-[#A9B2C7] text-sm">Nenhuma transferência pendente.</p>
              )}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  };

  if (loading || !user) {
    return (
      <RequireAuth>
        <LoadingShell message="Carregando transferências..." fullScreen={false} />
      </RequireAuth>
    );
  }

  const sentPending = transfers.sent.filter(t => t.status === 'PENDENTE');

  return (
    <RequireAuth>
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <SectionTitle 
          title="Transferências entre contas"
          subtitle="Envie e receba transferências de Personagem, Coleção, Mérito e Link Estelar entre contas CABAL ZIRON"
          centered={false}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Accordion type="single" collapsible className="space-y-4">
            {renderSection('PERSONAGEM', User, 'Personagem', 'Use esta seção para solicitar a transferência de um personagem para outra conta.')}
            {renderSection('COLECAO', Award, 'Coleção', 'Transfira coleções entre contas CABAL ZIRON.')}
            {renderSection('MERITO', Star, 'Mérito', 'Envie pontos de Mérito para outros jogadores.')}
            {renderSection('LINK_ESTELAR', Link2, 'Link Estelar', 'Transfira Links Estelares entre suas contas.')}
          </Accordion>
        </motion.div>

        {/* History */}
        {sentPending.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-[#19E0FF]" />
              Minhas Transferências Enviadas (Pendentes)
            </h3>
            <div className="space-y-3">
              {sentPending.map(transfer => (
                <GlowCard key={transfer.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white font-bold">{transfer.type}</p>
                      <p className="text-[#A9B2C7] text-sm">Para: {transfer.to_username}</p>
                      {transfer.type === 'MERITO' && (
                        <p className="text-[#A9B2C7] text-sm">Quantidade: {transfer.quantity}</p>
                      )}
                      {transfer.notes && (
                        <p className="text-[#A9B2C7] text-sm">{transfer.notes}</p>
                      )}
                      <p className="text-[#A9B2C7] text-xs mt-1">
                        {new Date(transfer.created_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(transfer.status)}
                      <MetalButton
                        onClick={() => handleCancel(transfer.id)}
                        disabled={processing === `cancel_${transfer.id}`}
                        loading={processing === `cancel_${transfer.id}`}
                        size="sm"
                        variant="danger"
                      >
                        Cancelar
                      </MetalButton>
                    </div>
                  </div>
                </GlowCard>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
    </RequireAuth>
  );
}