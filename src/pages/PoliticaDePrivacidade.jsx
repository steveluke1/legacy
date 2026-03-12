import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PoliticaDePrivacidade() {
  return (
    <div className="min-h-screen bg-[#05070B] py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <Link 
        to={createPageUrl('Home')}
        className="inline-flex items-center gap-2 text-[#A9B2C7] hover:text-white transition-colors mb-8"
        >
        <ChevronLeft className="w-4 h-4" />
        Voltar ao início
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0C121C] border border-[#19E0FF]/20 rounded-xl p-8 md:p-12"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Política de Privacidade</h1>
          <p className="text-[#19E0FF] mb-8">Legacy of Nevareth</p>

          <div className="space-y-8 text-[#A9B2C7]">
            {/* Introdução */}
            <section>
              <p className="leading-relaxed">
                A privacidade dos usuários é uma prioridade para o <strong className="text-white">Legacy of Nevareth</strong>.
                Esta Política de Privacidade descreve de forma transparente como coletamos, utilizamos, armazenamos e protegemos dados pessoais, em conformidade com a <strong className="text-white">Lei Geral de Proteção de Dados (LGPD – Lei nº 13.709/2018)</strong>.
              </p>
              <p className="leading-relaxed mt-3">
                Ao utilizar nossos serviços, você concorda com as práticas descritas neste documento.
              </p>
            </section>

            {/* 1. Dados Coletados */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4">1. Dados Coletados</h2>
              <p className="leading-relaxed mb-3">
                Durante o cadastro e uso dos serviços, podemos coletar os seguintes dados:
              </p>
              
              <div className="ml-4 space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">1.1 Dados de Cadastro</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Nome de usuário</li>
                    <li>Endereço de e-mail</li>
                    <li>Senha (armazenada exclusivamente em formato criptografado/hasheado)</li>
                    <li>Data de criação da conta</li>
                    <li>Informações opcionais fornecidas pelo usuário (ex.: "como conheceu o servidor")</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">1.2 Dados de Uso</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Endereço IP</li>
                    <li>Registros de login e atividades</li>
                    <li>Dados de gameplay (personagens, progresso, itens e rankings)</li>
                    <li>Interações no jogo, marketplace e sistemas comunitários</li>
                    <li>Transações virtuais internas (compras, vendas, trocas e histórico)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">1.3 Dados Técnicos</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Tipo de navegador, dispositivo e sistema operacional</li>
                    <li>Informações de conexão</li>
                    <li>Logs técnicos, métricas de desempenho e registros de erro</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 2. Finalidade do Tratamento dos Dados */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4">2. Finalidade do Tratamento dos Dados</h2>
              <p className="leading-relaxed mb-3">
                Os dados coletados são utilizados exclusivamente para finalidades legítimas, incluindo:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-white">Prestação dos serviços:</strong> criação e gerenciamento de contas, acesso ao jogo e funcionalidades</li>
                <li><strong className="text-white">Segurança:</strong> prevenção de fraudes, uso indevido, cheats, bots e abusos</li>
                <li><strong className="text-white">Comunicação:</strong> envio de avisos importantes, atualizações e informações operacionais</li>
                <li><strong className="text-white">Melhoria contínua:</strong> análise estatística e aprimoramento da experiência do usuário</li>
                <li><strong className="text-white">Suporte:</strong> atendimento a solicitações, dúvidas e suporte técnico</li>
                <li><strong className="text-white">Conformidade legal:</strong> cumprimento de obrigações legais e regulatórias</li>
              </ul>
              <p className="leading-relaxed mt-3">
                Não utilizamos dados pessoais para finalidades incompatíveis com estas descrições.
              </p>
            </section>

            {/* 3. Armazenamento e Segurança */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4">3. Armazenamento e Segurança</h2>
              <p className="leading-relaxed mb-3">
                Adotamos medidas técnicas e organizacionais razoáveis para proteger os dados pessoais, incluindo:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Armazenamento de senhas com algoritmos seguros de hash (ex.: PBKDF2 com salt)</li>
                <li>Proteção das comunicações por meio de criptografia (HTTPS)</li>
                <li>Controle de acesso restrito a pessoal autorizado</li>
                <li>Backups periódicos para mitigação de perda de dados</li>
                <li>Monitoramento de sistemas para detecção de incidentes</li>
              </ul>
              <p className="leading-relaxed mt-3">
                Apesar das medidas adotadas, nenhum sistema é completamente infalível. Recomendamos que os usuários utilizem senhas fortes e exclusivas.
              </p>
            </section>

            {/* 4. Compartilhamento de Dados */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4">4. Compartilhamento de Dados</h2>
              <p className="leading-relaxed mb-3">
                O <strong className="text-white">Legacy of Nevareth não vende nem comercializa dados pessoais</strong>.
              </p>
              <p className="leading-relaxed mb-3">
                Os dados podem ser compartilhados apenas nas seguintes hipóteses:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-white">Consentimento do usuário</strong>, quando aplicável</li>
                <li><strong className="text-white">Obrigação legal</strong>, ordem judicial ou requisição de autoridade competente</li>
                <li><strong className="text-white">Proteção de direitos</strong>, segurança e integridade do serviço ou de terceiros</li>
                <li><strong className="text-white">Prestadores de serviço</strong>, como hospedagem ou infraestrutura técnica, sempre sob obrigação contratual de confidencialidade</li>
              </ul>
            </section>

            {/* 5. Cookies e Tecnologias Semelhantes */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4">5. Cookies e Tecnologias Semelhantes</h2>
              <p className="leading-relaxed mb-3">
                Utilizamos cookies e tecnologias similares para:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Manter sessões autenticadas</li>
                <li>Armazenar preferências do usuário</li>
                <li>Coletar métricas estatísticas e de desempenho</li>
                <li>Reforçar segurança e prevenção de abusos</li>
              </ul>
              <p className="leading-relaxed mt-3">
                O usuário pode desativar cookies no navegador, ciente de que algumas funcionalidades podem ser limitadas.
              </p>
            </section>

            {/* 6. Direitos do Usuário (LGPD) */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4">6. Direitos do Usuário (LGPD)</h2>
              <p className="leading-relaxed mb-3">
                Nos termos da LGPD, o usuário pode solicitar, a qualquer momento:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Confirmação da existência de tratamento de dados</li>
                <li>Acesso aos dados pessoais</li>
                <li>Correção de dados incompletos, inexatos ou desatualizados</li>
                <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos</li>
                <li>Portabilidade dos dados, quando aplicável</li>
                <li>Revogação de consentimento</li>
                <li>Informação sobre compartilhamento de dados</li>
                <li>Oposição a determinados tratamentos, quando cabível</li>
              </ul>
              <p className="leading-relaxed mt-3">
                As solicitações devem ser feitas pelos canais indicados nesta política.
              </p>
            </section>

            {/* 7. Retenção e Exclusão de Dados */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4">7. Retenção e Exclusão de Dados</h2>
              <p className="leading-relaxed mb-3">
                Os dados pessoais são mantidos apenas pelo período necessário para:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Prestação dos serviços</li>
                <li>Cumprimento de obrigações legais</li>
                <li>Prevenção de fraudes e segurança</li>
                <li>Resolução de disputas</li>
              </ul>
              
              <h3 className="font-semibold text-white mt-6 mb-3">Exclusão de Conta</h3>
              <p className="leading-relaxed mb-3">
                O usuário pode solicitar a exclusão da conta. Após a exclusão:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Os dados pessoais serão removidos ou anonimizados, quando possível</li>
                <li>Alguns registros poderão ser mantidos por obrigação legal, auditoria ou segurança</li>
                <li>A exclusão é irreversível e implica perda total de acesso, personagens e itens</li>
              </ul>
            </section>

            {/* 8. Controlador de Dados e Contato */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4">8. Controlador de Dados e Contato</h2>
              <p className="leading-relaxed mb-3">
                O <strong className="text-white">Legacy of Nevareth</strong> atua como <strong className="text-white">Controlador de Dados</strong>, nos termos da LGPD.
              </p>
              <p className="leading-relaxed mb-3">
                Canais de contato:
              </p>
              <ul className="list-none space-y-2 ml-4">
                <li>• <strong className="text-white">E-mail de Privacidade:</strong> <span className="text-[#19E0FF]">privacy@legacyofnevareth.com</span></li>
                <li>• <strong className="text-white">Discord:</strong> <span className="text-[#19E0FF]">https://discord.gg/legacyofnevareth</span></li>
                <li>• <strong className="text-white">E-mail Geral:</strong> <span className="text-[#19E0FF]">contact@legacyofnevareth.com</span></li>
              </ul>
              <p className="leading-relaxed mt-3">
                Responderemos às solicitações dentro dos prazos legais (até 15 dias, prorrogáveis conforme a LGPD).
              </p>
            </section>

            {/* 9. Alterações desta Política */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4">9. Alterações desta Política</h2>
              <p className="leading-relaxed mb-3">
                Esta Política de Privacidade pode ser atualizada a qualquer momento.
                Alterações passam a valer imediatamente após a publicação. O uso contínuo dos serviços implica concordância com a versão vigente.
              </p>
            </section>

            {/* Última atualização */}
            <div className="pt-8 border-t border-[#19E0FF]/20">
              <p className="text-sm text-[#A9B2C7]">
                Última atualização: 22 de dezembro de 2025
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}