import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function TermosMarketplaceAlz() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#05070B] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#19E0FF] hover:text-[#1A9FE8] mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar
        </button>

        <div className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-[#19E0FF]" />
            <h1 className="text-3xl font-bold text-white">Termos do Marketplace de ALZ</h1>
          </div>

          <div className="space-y-6 text-[#A9B2C7]">
            <section>
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#10B981]" />
                Entrega Digital
              </h2>
              <ul className="list-disc list-inside space-y-2 ml-6">
                <li>A compra de ALZ é uma transação digital instantânea.</li>
                <li>A entrega do ALZ começa imediatamente após a confirmação do pagamento.</li>
                <li>O ALZ será enviado diretamente para o personagem informado durante a compra.</li>
                <li>O prazo de entrega é de até 24 horas, mas geralmente ocorre em minutos.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#F7CE46]" />
                Responsabilidade do Comprador
              </h2>
              <ul className="list-disc list-inside space-y-2 ml-6">
                <li>
                  <strong className="text-white">Nome do personagem:</strong> Você é responsável por informar o nome correto do personagem que receberá o ALZ.
                </li>
                <li>
                  Se o nome estiver incorreto (mesmo que exista no jogo), a entrega será feita para o personagem informado e não haverá reversão.
                </li>
                <li>Verifique cuidadosamente o nome do personagem antes de finalizar a compra.</li>
                <li>O personagem deve estar na mesma conta que você está logado no portal.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">Sem Reversão Após Entrega</h2>
              <ul className="list-disc list-inside space-y-2 ml-6">
                <li>Uma vez que o ALZ for entregue, a transação é final e irreversível.</li>
                <li>Não realizamos estornos ou devoluções após a entrega.</li>
                <li>Em caso de erro no nome do personagem informado, não será possível recuperar o ALZ.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">Segurança e Antifraude</h2>
              <ul className="list-disc list-inside space-y-2 ml-6">
                <li>Todas as transações são monitoradas para prevenir fraudes.</li>
                <li>Transações suspeitas podem ser revisadas manualmente antes da entrega.</li>
                <li>Compras de alto valor podem ter cooldown de segurança.</li>
                <li>Reservamos o direito de cancelar transações suspeitas e reembolsar o valor pago.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">Taxa do Marketplace</h2>
              <ul className="list-disc list-inside space-y-2 ml-6">
                <li>O marketplace cobra uma taxa sobre cada transação para manutenção e segurança.</li>
                <li>A taxa já está incluída no preço exibido ao comprador.</li>
                <li>O vendedor recebe o valor líquido após dedução da taxa.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">Suporte</h2>
              <ul className="list-disc list-inside space-y-2 ml-6">
                <li>Em caso de dúvidas ou problemas, entre em contato com o suporte através do Discord oficial.</li>
                <li>Guarde sempre o ID do pedido para referência.</li>
                <li>O suporte responderá em até 24 horas úteis.</li>
              </ul>
            </section>

            <div className="pt-6 border-t border-[#19E0FF]/20 mt-8">
              <p className="text-sm text-[#A9B2C7]">
                Ao utilizar o marketplace, você concorda com estes termos.
                <br />
                Última atualização: {new Date().toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}