import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, ExternalLink, QrCode, CreditCard, Clock, AlertCircle } from 'lucide-react';
import GlowCard from '@/components/ui/GlowCard';
import GradientButton from '@/components/ui/GradientButton';
import { Badge } from '@/components/ui/badge';

export default function PaymentInstructions({ paymentData, listingSnapshot, onSimulatePayment }) {
  const [copied, setCopied] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const copyPixCode = () => {
    if (paymentData.pix_code) {
      navigator.clipboard.writeText(paymentData.pix_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSimulatePayment = async () => {
    setSimulating(true);
    await onSimulatePayment();
    setSimulating(false);
  };

  return (
    <div className="space-y-6">
      {/* Success header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-10 h-10 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Pedido criado com sucesso!</h2>
        <p className="text-[#A9B2C7]">Siga as instruções abaixo para completar o pagamento</p>
      </motion.div>

      {/* Order summary */}
      <GlowCard className="p-6">
        <h3 className="text-lg font-bold text-white mb-4">Resumo do pedido</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-[#A9B2C7]">Tipo:</span>
            <Badge className={listingSnapshot.type === 'ALZ' ? 'bg-[#F7CE46]/20 text-[#F7CE46]' : 'bg-[#19E0FF]/20 text-[#19E0FF]'}>
              {listingSnapshot.type === 'ALZ' ? 'ALZ' : 'Item'}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-[#A9B2C7]">Produto:</span>
            <span className="text-white font-medium">
              {listingSnapshot.type === 'ALZ' 
                ? `${listingSnapshot.alz_amount?.toLocaleString()} ALZ`
                : listingSnapshot.item_name
              }
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#A9B2C7]">Vendedor:</span>
            <span className="text-white">{listingSnapshot.seller_username}</span>
          </div>
          <div className="flex justify-between pt-3 border-t border-[#19E0FF]/10">
            <span className="text-white font-bold">Valor total:</span>
            <span className="text-2xl font-bold text-[#19E0FF]">
              R$ {paymentData.amount?.toFixed(2)}
            </span>
          </div>
        </div>
      </GlowCard>

      {/* Payment options */}
      <GlowCard className="p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-[#19E0FF]" />
          Opções de pagamento
        </h3>

        <div className="space-y-4">
          {/* Payment URL (card, boleto, etc) */}
          {paymentData.payment_url && (
            <a 
              href={paymentData.payment_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block"
            >
              <div className="p-4 bg-[#05070B] border border-[#19E0FF]/20 rounded-lg hover:border-[#19E0FF]/50 transition-all group cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#19E0FF]/20 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-[#19E0FF]" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Pagar com cartão ou boleto</p>
                      <p className="text-[#A9B2C7] text-sm">Você será redirecionado para a página segura de pagamento</p>
                    </div>
                  </div>
                  <ExternalLink className="w-5 h-5 text-[#A9B2C7] group-hover:text-white transition-colors" />
                </div>
              </div>
            </a>
          )}

          {/* PIX */}
          {paymentData.pix_code && (
            <div className="p-4 bg-[#05070B] border border-[#19E0FF]/20 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-[#19E0FF]/20 rounded-lg flex items-center justify-center">
                  <QrCode className="w-6 h-6 text-[#19E0FF]" />
                </div>
                <div>
                  <p className="text-white font-medium">Pagar com PIX</p>
                  <p className="text-[#A9B2C7] text-sm">Código Copia e Cola</p>
                </div>
              </div>
              
              <div className="p-3 bg-white rounded-lg mb-3">
                <code className="text-gray-800 text-xs break-all block">
                  {paymentData.pix_code}
                </code>
              </div>

              <GradientButton
                variant="secondary"
                className="w-full"
                onClick={copyPixCode}
              >
                {copied ? (
                  <><Check className="w-4 h-4 mr-2" /> Copiado!</>
                ) : (
                  <><Copy className="w-4 h-4 mr-2" /> Copiar código PIX</>
                )}
              </GradientButton>
            </div>
          )}
        </div>
      </GlowCard>

      {/* Next steps */}
      <GlowCard className="p-6">
        <h3 className="text-lg font-bold text-white mb-4">Próximos passos</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#19E0FF]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[#19E0FF] text-sm font-bold">1</span>
            </div>
            <p className="text-[#A9B2C7]">Complete o pagamento usando uma das opções acima</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#19E0FF]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[#19E0FF] text-sm font-bold">2</span>
            </div>
            <p className="text-[#A9B2C7]">Aguarde a confirmação automática do pagamento (geralmente instantâneo)</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#19E0FF]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[#19E0FF] text-sm font-bold">3</span>
            </div>
            <p className="text-[#A9B2C7]">Entre no jogo CABAL ZIRON e combine com o vendedor para receber o {listingSnapshot.type === 'ALZ' ? 'ALZ' : 'item'}</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#19E0FF]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[#19E0FF] text-sm font-bold">4</span>
            </div>
            <p className="text-[#A9B2C7]">Após receber, confirme em "Minhas Compras" para finalizar a transação</p>
          </div>
        </div>
      </GlowCard>

      {/* Test mode button (only in development) */}
      {paymentData.transaction_id && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-yellow-400 font-medium mb-1">Modo de teste ativo</p>
              <p className="text-[#A9B2C7] text-sm">
                Esta é uma transação de teste. Use o botão abaixo para simular a aprovação do pagamento.
              </p>
            </div>
          </div>
          <GradientButton
            variant="honor"
            className="w-full"
            onClick={handleSimulatePayment}
            loading={simulating}
          >
            <Clock className="w-4 h-4 mr-2" />
            Simular pagamento aprovado (teste)
          </GradientButton>
        </div>
      )}
    </div>
  );
}