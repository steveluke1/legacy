import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, FileText, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthProvider';
import RequireAuth from '@/components/auth/RequireAuth';
import SectionTitle from '@/components/ui/SectionTitle';
import GlowCard from '@/components/ui/GlowCard';
import GradientButton from '@/components/ui/GradientButton';
import { Checkbox } from '@/components/ui/checkbox';

export default function MercadoTermos() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);

  const returnUrl = new URLSearchParams(location.search).get('return') || 'Mercado';

  useEffect(() => {
    if (user) {
      checkTermsAcceptance();
    }
  }, [user]);

  const checkTermsAcceptance = async () => {
    try {
      const response = await base44.functions.invoke('market_checkRMTTerms', {});
      if (response.data && response.data.has_accepted) {
        setHasAccepted(true);
      }
    } catch (e) {
      console.error('Erro ao verificar termos:', e);
    }
  };

  const handleAccept = async () => {
    if (!accepted) return;

    setLoading(true);
    try {
      const urlParams = new URLSearchParams(location.search);
      const orderId = urlParams.get('order_id');
      
      const response = await base44.functions.invoke('market_acceptRMTTerms', {
        order_reference: orderId || null
      });
      if (response.data && response.data.success) {
        navigate(createPageUrl(returnUrl));
      }
    } catch (e) {
      alert('Erro ao aceitar termos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (hasAccepted) {
    return (
      <div className="min-h-screen py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Você já aceitou os termos</h2>
            <p className="text-[#A9B2C7] mb-6">Você pode usar o Mercado ZIRON normalmente.</p>
            <GradientButton onClick={() => navigate(createPageUrl(returnUrl))}>
              Continuar
            </GradientButton>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <RequireAuth>
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <SectionTitle 
          title="Termos de Uso do Mercado ZIRON"
          subtitle="Leia atentamente antes de utilizar o marketplace"
          centered={false}
        />

        {/* Warning banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
        >
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-yellow-400 font-bold mb-2">Aviso Importante</h3>
              <p className="text-[#A9B2C7]">
                Este marketplace permite comércio real (RMT - Real Money Trading) entre jogadores. 
                Leia todos os termos com atenção antes de aceitar.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Terms content */}
        <GlowCard className="p-8 mb-8">
          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <FileText className="w-6 h-6 text-[#19E0FF]" />
              Termos e Condições
            </h2>

            <div className="space-y-6 text-[#A9B2C7]">
              <section>
                <h3 className="text-xl font-bold text-white mb-3">1. Sobre o Mercado ZIRON</h3>
                <p>
                  O Mercado ZIRON é uma plataforma que facilita transações entre jogadores do servidor privado 
                  CABAL ZIRON. Através desta plataforma, você pode comprar e vender ALZ (moeda do jogo) e 
                  itens virtuais usando dinheiro real (BRL).
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-white mb-3">2. Responsabilidades</h3>
                <p className="mb-3">O CABAL ZIRON <strong className="text-white">NÃO É RESPONSÁVEL</strong> por:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Acordos feitos fora da plataforma</li>
                  <li>Negociações diretas entre jogadores sem uso do sistema</li>
                  <li>Problemas de comunicação entre comprador e vendedor</li>
                  <li>Atrasos na entrega causados por indisponibilidade das partes</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-white mb-3">3. Como Funciona</h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Vendedor cria anúncio com preço em BRL</li>
                  <li>Comprador realiza pagamento através do gateway seguro</li>
                  <li>Após confirmação do pagamento, vendedor e comprador combinam entrega dentro do jogo</li>
                  <li>Comprador confirma recebimento na plataforma, finalizando a transação</li>
                </ol>
              </section>

              <section>
                <h3 className="text-xl font-bold text-white mb-3">4. Você Aceita Que:</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>A entrega de ALZ/Itens ocorre <strong className="text-white">dentro do jogo</strong> entre usuários</li>
                  <li>Disputas podem ser avaliadas manualmente pela equipe</li>
                  <li>Pagamentos são <strong className="text-white">irreversíveis</strong> após confirmação do comprador</li>
                  <li>Infrações às regras geram <strong className="text-red-400">banimento permanente</strong></li>
                  <li>Você deve ter pelo menos 18 anos ou consentimento dos pais para transacionar</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-white mb-3">5. Regras de Conduta</h3>
                <p className="mb-3">São <strong className="text-red-400">PROIBIDAS</strong> as seguintes ações:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Fraude ou tentativa de fraude</li>
                  <li>Anúncios falsos ou enganosos</li>
                  <li>Não entregar item/ALZ após pagamento confirmado</li>
                  <li>Chargeback sem motivo válido</li>
                  <li>Usar o sistema para lavagem de dinheiro</li>
                  <li>Criar múltiplas contas para manipular o mercado</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-bold text-white mb-3">6. Sistema de Disputas</h3>
                <p>
                  Em caso de problemas, você pode abrir uma disputa através do suporte. A equipe irá analisar 
                  os logs, conversas e evidências para tomar uma decisão. A decisão da equipe é final.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-white mb-3">7. Privacidade e Dados</h3>
                <p>
                  Todas as transações são registradas para fins de auditoria e segurança. Dados de pagamento 
                  são processados por gateways certificados (Mercado Pago). A equipe CABAL ZIRON não tem 
                  acesso a dados de cartão de crédito.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-bold text-white mb-3">8. Alterações nos Termos</h3>
                <p>
                  Reservamo-nos o direito de alterar estes termos a qualquer momento. Usuários serão 
                  notificados por email sobre mudanças significativas.
                </p>
              </section>

              <section className="pt-6 border-t border-[#19E0FF]/20">
                <p className="text-white font-bold">
                  Ao aceitar estes termos, você declara que leu, entendeu e concorda com todas as 
                  condições acima descritas.
                </p>
              </section>
            </div>
          </div>
        </GlowCard>

        {/* Accept checkbox */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <GlowCard className="p-6">
            <div className="flex items-start gap-4">
              <Checkbox
                id="accept-terms"
                checked={accepted}
                onCheckedChange={setAccepted}
                className="border-[#19E0FF]/50 data-[state=checked]:bg-[#19E0FF] data-[state=checked]:border-[#19E0FF] mt-1"
              />
              <label htmlFor="accept-terms" className="text-white cursor-pointer flex-1">
                <span className="font-bold">Li e concordo com os Termos de RMT do CABAL ZIRON.</span>
                <p className="text-[#A9B2C7] text-sm mt-2">
                  Ao marcar esta opção, você confirma que leu todos os termos acima e concorda com eles.
                </p>
              </label>
            </div>
          </GlowCard>
        </motion.div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <GradientButton
            onClick={handleAccept}
            disabled={!accepted}
            loading={loading}
            className="flex-1"
            size="lg"
          >
            <Check className="w-5 h-5 mr-2" />
            Aceitar e continuar
          </GradientButton>
          <GradientButton
            variant="secondary"
            onClick={() => navigate(createPageUrl('Home'))}
            className="flex-1"
            size="lg"
          >
            Voltar ao início
          </GradientButton>
        </div>
      </div>
    </div>
    </RequireAuth>
  );
}