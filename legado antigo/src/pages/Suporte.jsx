import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageCircle, Mail, HelpCircle, FileQuestion, 
  Bug, CreditCard, Shield, ChevronDown, ExternalLink,
  Send, Loader2, Check
} from 'lucide-react';
import RequireAuth from '@/components/auth/RequireAuth';
import GlowCard from '@/components/ui/GlowCard';
import SectionTitle from '@/components/ui/SectionTitle';
import GradientButton from '@/components/ui/GradientButton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const contactOptions = [
  {
    icon: MessageCircle,
    title: 'Discord',
    description: 'Suporte rápido pela comunidade',
    action: 'Entrar no Discord',
    link: 'https://discord.gg/cabalziron',
    color: '#5865F2'
  },
  {
    icon: Mail,
    title: 'E-mail',
    description: 'Para assuntos mais complexos',
    action: 'suporte@cabalziron.com',
    link: 'mailto:suporte@cabalziron.com',
    color: '#19E0FF'
  }
];

const ticketCategories = [
  { value: 'account', label: 'Problemas de Conta', icon: Shield },
  { value: 'bug', label: 'Reportar Bug', icon: Bug },
  { value: 'payment', label: 'Pagamentos/Doações', icon: CreditCard },
  { value: 'question', label: 'Dúvida Geral', icon: HelpCircle },
  { value: 'other', label: 'Outro', icon: FileQuestion }
];

const faqs = [
  {
    question: 'Como faço para criar uma conta?',
    answer: 'Para criar uma conta, clique em "Criar Conta" no menu superior, preencha seus dados (nome de usuário, e-mail e senha) e aceite os termos de uso. Após o registro, você poderá baixar o cliente e começar a jogar!'
  },
  {
    question: 'O CABAL ZIRON é gratuito?',
    answer: 'Sim! O CABAL ZIRON é completamente gratuito para jogar (Free to Play). Oferecemos algumas opções de doação para itens cosméticos, mas nada que afete a jogabilidade de forma pay-to-win.'
  },
  {
    question: 'Quais são os requisitos mínimos?',
    answer: 'Requisitos mínimos: Windows 7/8/10/11, Processador Dual Core 2.0GHz, 4GB RAM, Placa de vídeo com 512MB, 10GB de espaço em disco. Recomendamos: Quad Core, 8GB RAM, GTX 750 ou superior.'
  },
  {
    question: 'Como entro em uma guilda?',
    answer: 'Você pode procurar guildas na página "Guildas" do site. Guildas que estão recrutando mostram um badge verde. Entre em contato com o líder da guilda desejada através do Discord ou in-game.'
  },
  {
    question: 'Perdi minha senha, como recupero?',
    answer: 'Na tela de login, clique em "Esqueceu a senha?". Você receberá um e-mail com instruções para redefinir sua senha. Certifique-se de verificar a pasta de spam.'
  },
  {
    question: 'Como funciona o sistema de honra?',
    answer: 'O sistema de honra recompensa jogadores que participam de PvP e TG (Tierra Gloriosa). Você ganha pontos de honra derrotando oponentes e vencendo batalhas de facção. Honra desbloqueia títulos e recompensas exclusivas.'
  },
  {
    question: 'Qual a diferença entre Capella e Procyon?',
    answer: 'São as duas facções de CABAL. A escolha é principalmente estética e afeta com quem você luta na TG (Tierra Gloriosa). Ambas têm acesso aos mesmos conteúdos. Escolha a que seus amigos jogam!'
  },
  {
    question: 'Como reporto um jogador ou bug?',
    answer: 'Use o formulário de suporte abaixo selecionando a categoria apropriada. Para bugs, inclua o máximo de detalhes possível (quando ocorreu, o que você estava fazendo, prints se possível).'
  }
];

export default function Suporte() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    subject: '',
    message: ''
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    
    // Simulate sending
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSending(false);
    setSent(true);
    
    setTimeout(() => {
      setSent(false);
      setFormData({
        name: '',
        email: '',
        category: '',
        subject: '',
        message: ''
      });
    }, 3000);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <RequireAuth>
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <SectionTitle 
          title="Suporte"
          subtitle="Estamos aqui para ajudar você"
        />

        {/* Contact Options */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          {contactOptions.map((option, index) => (
            <motion.a
              key={index}
              href={option.link}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlowCard className="p-6 group" glowColor={option.color}>
                <div className="flex items-start gap-4">
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${option.color}20` }}
                  >
                    <option.icon className="w-7 h-7" style={{ color: option.color }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">{option.title}</h3>
                    <p className="text-[#A9B2C7] text-sm mb-2">{option.description}</p>
                    <span className="text-[#19E0FF] text-sm flex items-center gap-1 group-hover:underline">
                      {option.action}
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </GlowCard>
            </motion.a>
          ))}
        </div>

        <div className="mt-12 grid lg:grid-cols-2 gap-8">
          {/* FAQ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlowCard className="p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#19E0FF]" />
                Perguntas Frequentes
              </h2>

              <Accordion type="single" collapsible className="space-y-2">
                {faqs.map((faq, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`faq-${index}`}
                    className="border border-[#19E0FF]/10 rounded-lg overflow-hidden"
                  >
                    <AccordionTrigger className="px-4 py-3 text-left text-white hover:text-[#19E0FF] hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 text-[#A9B2C7]">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </GlowCard>
          </motion.div>

          {/* Support Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <GlowCard className="p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Send className="w-5 h-5 text-[#19E0FF]" />
                Enviar Ticket
              </h2>

              {sent ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Ticket Enviado!</h3>
                  <p className="text-[#A9B2C7]">Responderemos em até 24 horas.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[#A9B2C7] mb-2">
                        Seu Nome
                      </label>
                      <Input
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        required
                        className="bg-[#05070B] border-[#19E0FF]/20 text-white"
                        placeholder="Nome completo"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#A9B2C7] mb-2">
                        E-mail
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        required
                        className="bg-[#05070B] border-[#19E0FF]/20 text-white"
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#A9B2C7] mb-2">
                      Categoria
                    </label>
                    <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                      <SelectTrigger className="bg-[#05070B] border-[#19E0FF]/20 text-white">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0C121C] border-[#19E0FF]/20">
                        {ticketCategories.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            <span className="flex items-center gap-2">
                              <cat.icon className="w-4 h-4 text-[#19E0FF]" />
                              {cat.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#A9B2C7] mb-2">
                      Assunto
                    </label>
                    <Input
                      value={formData.subject}
                      onChange={(e) => handleChange('subject', e.target.value)}
                      required
                      className="bg-[#05070B] border-[#19E0FF]/20 text-white"
                      placeholder="Resumo do problema"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#A9B2C7] mb-2">
                      Mensagem
                    </label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) => handleChange('message', e.target.value)}
                      required
                      className="bg-[#05070B] border-[#19E0FF]/20 text-white min-h-[120px]"
                      placeholder="Descreva seu problema com o máximo de detalhes..."
                    />
                  </div>

                  <GradientButton
                    type="submit"
                    loading={sending}
                    className="w-full"
                  >
                    {sending ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Enviando...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Send className="w-5 h-5" />
                        Enviar Ticket
                      </span>
                    )}
                  </GradientButton>
                </form>
              )}
            </GlowCard>
          </motion.div>
        </div>
      </div>
    </div>
    </RequireAuth>
  );
}