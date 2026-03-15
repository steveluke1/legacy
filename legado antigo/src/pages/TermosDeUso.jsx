import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TermosDeUso() {
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
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Termos de Uso</h1>
          <p className="text-[#19E0FF] mb-8">Legacy of Nevareth</p>

          <div className="space-y-8 text-[#A9B2C7]">
            {/* 1. Aceitação dos Termos */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4">1. Aceitação dos Termos</h2>
              <p className="leading-relaxed">
                Ao criar uma conta, acessar ou utilizar qualquer serviço disponibilizado pelo <strong className="text-white">Legacy of Nevareth</strong>, você declara que <strong className="text-white">leu, compreendeu e concorda integralmente</strong> com estes Termos de Uso.
              </p>
              <p className="leading-relaxed mt-3">
                Caso você <strong className="text-white">não concorde</strong> com qualquer cláusula aqui descrita, <strong className="text-white">não deve acessar ou utilizar</strong> nossos serviços.
              </p>
            </section>

            {/* 2. Descrição do Serviço */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4">2. Descrição do Serviço</h2>
              <p className="leading-relaxed mb-3">
                O <strong className="text-white">Legacy of Nevareth</strong> é um <strong className="text-white">servidor privado de entretenimento</strong>, inspirado no jogo <strong className="text-white">CABAL Online</strong>, operado de forma <strong className="text-white">independente</strong>, com finalidade recreativa e comunitária.
              </p>
              <p className="leading-relaxed mb-3">
                Os serviços oferecidos incluem, mas não se limitam a:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Acesso a um ambiente de jogo online multiplayer</li>
                <li>Sistemas de ranking, competições e eventos</li>
                <li>Mercado interno de itens e moedas virtuais (ALZ, CASH)</li>
                <li>Recursos sociais, como guildas e comunidade</li>
                <li>Atualizações, ajustes e eventos periódicos</li>
              </ul>
              
              <h3 className="text-lg font-semibold text-white mt-6 mb-3">Aviso Importante de Independência</h3>
              <p className="leading-relaxed">
                O <strong className="text-white">Legacy of Nevareth</strong> <strong className="text-white">não possui qualquer vínculo, afiliação, parceria ou endosso oficial</strong> da <strong className="text-white">ESTsoft Corp.</strong>, da <strong className="text-white">CABAL Online</strong> original ou de qualquer empresa relacionada.
              </p>
              <p className="leading-relaxed mt-2">
                Todas as marcas registradas pertencem aos seus respectivos proprietários.
              </p>
            </section>

            {/* 3. Elegibilidade do Usuário */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4">3. Elegibilidade do Usuário</h2>
              <p className="leading-relaxed mb-3">
                Para utilizar os serviços do Legacy of Nevareth, você declara que:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Possui <strong className="text-white">13 anos de idade ou mais</strong></li>
                <li>Fornecerá informações <strong className="text-white">verdadeiras, completas e atualizadas</strong> durante o cadastro</li>
                <li>É responsável por todas as ações realizadas em sua conta</li>
                <li>Não utilizará contas de terceiros sem autorização expressa</li>
              </ul>
              <p className="leading-relaxed mt-3">
                O uso dos serviços por menores de idade ocorre <strong className="text-white">sob responsabilidade exclusiva dos pais ou responsáveis legais</strong>.
              </p>
            </section>

            {/* 4. Conta do Usuário e Responsabilidades */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4">4. Conta do Usuário e Responsabilidades</h2>
              <p className="leading-relaxed mb-3">
                Ao criar uma conta, você é integralmente responsável por:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Manter a confidencialidade de suas credenciais de acesso</li>
                <li>Todas as atividades realizadas por meio de sua conta</li>
                <li>Notificar imediatamente a equipe sobre qualquer uso não autorizado</li>
                <li>Não compartilhar, vender, transferir, alugar ou ceder sua conta</li>
              </ul>
              <p className="leading-relaxed mt-3">
                A equipe do Legacy of Nevareth <strong className="text-white">não se responsabiliza</strong> por perdas decorrentes de acesso indevido causado por negligência do usuário.
              </p>
            </section>

            {/* 5. Conduta do Usuário */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4">5. Conduta do Usuário</h2>
              <p className="leading-relaxed mb-3">
                Ao utilizar nossos serviços, você concorda <strong className="text-white">expressamente em NÃO</strong>:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Utilizar cheats, hacks, bots, scripts ou softwares não autorizados</li>
                <li>Explorar bugs, falhas ou vulnerabilidades para obter vantagens indevidas</li>
                <li>Assediar, insultar, ameaçar ou discriminar outros jogadores</li>
                <li>Compartilhar conteúdo ilegal, ofensivo, difamatório ou prejudicial</li>
                <li>Realizar spam, propaganda não autorizada ou atividades comerciais indevidas</li>
                <li>Tentar acessar contas, dados ou sistemas de terceiros</li>
                <li>Interferir no funcionamento normal dos servidores ou serviços</li>
              </ul>
            </section>

            {/* 6. Economia Virtual, Itens e RMT */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4">6. Economia Virtual, Itens e RMT</h2>
              <p className="leading-relaxed mb-3">
                O Legacy of Nevareth possui uma <strong className="text-white">economia virtual interna</strong>, que pode incluir moedas de jogo (ALZ, CASH) e itens digitais.
              </p>
              <p className="leading-relaxed mb-3">
                Você reconhece e concorda que:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Itens e moedas virtuais <strong className="text-white">não possuem valor monetário real</strong> fora do ambiente do jogo</li>
                <li>Nenhum item, moeda ou benefício virtual constitui propriedade do usuário</li>
                <li>O acesso a itens e moedas é um <strong className="text-white">direito de uso revogável</strong>, não uma posse permanente</li>
                <li>O sistema de RMT (Real Money Trading), quando permitido, segue <strong className="text-white">regras específicas</strong> publicadas separadamente</li>
                <li>Transações entre jogadores devem respeitar integralmente as regras da plataforma</li>
              </ul>
              <p className="leading-relaxed mt-3">
                O Legacy of Nevareth reserva-se o direito de <strong className="text-white">modificar, ajustar, balancear ou remover</strong> itens, moedas ou sistemas econômicos <strong className="text-white">a qualquer momento</strong>, sem obrigação de compensação.
              </p>
            </section>

            {/* 7. Suspensão e Encerramento de Conta */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4">7. Suspensão e Encerramento de Conta</h2>
              <p className="leading-relaxed mb-3">
                Reservamo-nos o direito de <strong className="text-white">suspender, restringir ou encerrar</strong> contas de usuários, de forma temporária ou permanente, <strong className="text-white">com ou sem aviso prévio</strong>, nos seguintes casos:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Violação destes Termos de Uso</li>
                <li>Uso de práticas fraudulentas ou abusivas</li>
                <li>Comportamento que comprometa a integridade do jogo ou da comunidade</li>
                <li>Atividades suspeitas ou que coloquem o serviço em risco</li>
                <li>Necessidade técnica, administrativa ou legal</li>
              </ul>
              <p className="leading-relaxed mt-3">
                Em caso de encerramento definitivo da conta, <strong className="text-white">não haverá reembolso</strong> de valores, itens ou moedas virtuais.
              </p>
            </section>

            {/* 8. Limitação de Responsabilidade */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4">8. Limitação de Responsabilidade</h2>
              <p className="leading-relaxed mb-3">
                Os serviços do Legacy of Nevareth são fornecidos <strong className="text-white">"no estado em que se encontram"</strong> e <strong className="text-white">"conforme disponibilidade"</strong>.
              </p>
              <p className="leading-relaxed mb-3">
                Não garantimos:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Disponibilidade contínua ou livre de falhas</li>
                <li>Ausência de erros, bugs ou interrupções</li>
                <li>Segurança absoluta contra ataques, invasões ou perdas de dados</li>
                <li>Preservação permanente de personagens, itens ou progressos</li>
                <li>Compatibilidade com todos os dispositivos ou sistemas operacionais</li>
              </ul>
              <p className="leading-relaxed mt-3">
                O Legacy of Nevareth <strong className="text-white">não se responsabiliza</strong> por danos diretos, indiretos, incidentais ou consequenciais decorrentes do uso ou impossibilidade de uso dos serviços.
              </p>
            </section>

            {/* 9. Alterações dos Termos */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4">9. Alterações dos Termos</h2>
              <p className="leading-relaxed mb-3">
                Estes Termos de Uso podem ser <strong className="text-white">alterados a qualquer momento</strong>, a critério da administração.
              </p>
              <p className="leading-relaxed mb-3">
                As alterações entram em vigor <strong className="text-white">imediatamente após sua publicação</strong>.
                O uso continuado dos serviços após qualquer modificação implica <strong className="text-white">aceitação automática</strong> dos novos termos.
              </p>
              <p className="leading-relaxed">
                Recomendamos que você revise este documento periodicamente.
              </p>
            </section>

            {/* 10. Contato */}
            <section>
              <h2 className="text-xl font-bold text-white mb-4">10. Contato</h2>
              <p className="leading-relaxed mb-3">
                Para dúvidas, sugestões ou questões relacionadas a estes Termos de Uso, entre em contato por meio de:
              </p>
              <ul className="list-none space-y-2 ml-4">
                <li>• <strong className="text-white">Discord:</strong> <span className="text-[#19E0FF]">https://discord.gg/legacyofnevareth</span></li>
                <li>• <strong className="text-white">E-mail:</strong> <span className="text-[#19E0FF]">contact@legacyofnevareth.com</span></li>
              </ul>
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