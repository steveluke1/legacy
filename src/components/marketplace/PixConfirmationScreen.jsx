import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Shield, Clock } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import GradientButton from '@/components/ui/GradientButton';

export default function PixConfirmationScreen({ 
  orderData, 
  onConfirm, 
  onCancel,
  isLoading = false 
}) {
  const [confirmations, setConfirmations] = useState({
    digitalDelivery: false,
    correctNick: false,
    antiFraud: false
  });

  const allConfirmed = Object.values(confirmations).every(v => v);

  const handleConfirm = () => {
    if (allConfirmed) {
      onConfirm(confirmations);
    }
  };

  return (
    <div className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-xl p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <Shield className="w-16 h-16 text-[#19E0FF] mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">
          Confirme os Detalhes da Compra
        </h2>
        <p className="text-[#A9B2C7]">
          Leia atentamente antes de gerar o PIX
        </p>
      </div>

      {/* Order Summary */}
      <div className="bg-[#05070B] rounded-lg p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-[#A9B2C7]">Quantidade de ALZ:</span>
          <span className="text-white font-bold text-lg">
            {orderData?.alz_amount?.toLocaleString()} ALZ
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#A9B2C7]">Valor Total:</span>
          <span className="text-[#10B981] font-bold text-xl">
            R$ {orderData?.price_brl?.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[#A9B2C7]">Personagem:</span>
          <span className="text-white font-bold">
            {orderData?.character_nick}
          </span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-[#A9B2C7]">Taxa marketplace:</span>
          <span className="text-[#A9B2C7]">
            Já incluída no preço (vendedor paga)
          </span>
        </div>
      </div>

      {/* Warning Box */}
      <div className="bg-[#F7CE46]/10 border border-[#F7CE46]/30 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 text-[#F7CE46] flex-shrink-0 mt-1" />
        <div className="space-y-2 text-sm">
          <p className="text-[#F7CE46] font-semibold">Atenção Importante:</p>
          <ul className="text-[#A9B2C7] space-y-1 list-disc list-inside">
            <li>A entrega é digital e começa imediatamente após confirmação do PIX</li>
            <li>Verifique o nome do personagem - não há reversão após entrega</li>
            <li>O prazo de entrega é de até 24h, mas geralmente ocorre em minutos</li>
            <li>Transações suspeitas podem ser bloqueadas para verificação</li>
          </ul>
        </div>
      </div>

      {/* Required Confirmations */}
      <div className="space-y-4">
        <p className="text-white font-semibold flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-[#19E0FF]" />
          Confirmações Obrigatórias:
        </p>

        <div className="space-y-3">
          <label className="flex items-start gap-3 cursor-pointer group">
            <Checkbox
              checked={confirmations.digitalDelivery}
              onCheckedChange={(checked) => 
                setConfirmations(prev => ({ ...prev, digitalDelivery: checked }))
              }
              className="mt-1"
            />
            <span className="text-[#A9B2C7] group-hover:text-white transition-colors">
              Entendi que a entrega é digital e começa imediatamente após confirmação do PIX.
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <Checkbox
              checked={confirmations.correctNick}
              onCheckedChange={(checked) => 
                setConfirmations(prev => ({ ...prev, correctNick: checked }))
              }
              className="mt-1"
            />
            <span className="text-[#A9B2C7] group-hover:text-white transition-colors">
              Entendi que se eu informar o nick errado, a entrega pode ocorrer para outro personagem e não haverá reversão.
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer group">
            <Checkbox
              checked={confirmations.antiFraud}
              onCheckedChange={(checked) => 
                setConfirmations(prev => ({ ...prev, antiFraud: checked }))
              }
              className="mt-1"
            />
            <span className="text-[#A9B2C7] group-hover:text-white transition-colors">
              Entendi que transações suspeitas podem ser bloqueadas para verificação antifraude.
            </span>
          </label>
        </div>
      </div>

      {/* Delivery Info */}
      <div className="flex items-center gap-3 p-4 bg-[#19E0FF]/5 border border-[#19E0FF]/20 rounded-lg">
        <Clock className="w-5 h-5 text-[#19E0FF]" />
        <div>
          <p className="text-white font-semibold text-sm">Prazo de Entrega</p>
          <p className="text-[#A9B2C7] text-sm">
            Geralmente em minutos, até 24h no máximo
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 px-6 py-3 bg-[#0C121C] border border-[#19E0FF]/20 text-white rounded-lg hover:bg-[#19E0FF]/10 transition-colors disabled:opacity-50"
        >
          Cancelar
        </button>
        <GradientButton
          onClick={handleConfirm}
          disabled={!allConfirmed || isLoading}
          loading={isLoading}
          className="flex-1"
        >
          {isLoading ? 'Gerando PIX...' : 'Gerar PIX e Finalizar'}
        </GradientButton>
      </div>

      {/* Terms Link */}
      <p className="text-center text-xs text-[#A9B2C7]">
        Ao continuar, você concorda com os{' '}
        <a 
          href="/TermosMarketplaceAlz" 
          target="_blank"
          className="text-[#19E0FF] hover:underline"
        >
          Termos do Marketplace
        </a>
      </p>
    </div>
  );
}