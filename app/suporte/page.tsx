import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, HelpCircle, Mail, MessageCircle, Shield, Bug, CreditCard } from "lucide-react";

import { PageShell } from "@/components/shared/page-shell";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Suporte",
  description: "Canais oficiais de suporte, perguntas frequentes e contato do portal Cabal Legacy.",
};

const contactChannels = [
  {
    title: "Discord",
    description: "Atendimento rápido pela comunidade e pelos moderadores do portal.",
    action: "Entrar no Discord",
    href: "https://discord.gg/caballegacy",
    icon: MessageCircle,
    accent: "#5865F2",
  },
  {
    title: "E-mail",
    description: "Para dúvidas de conta, pagamentos e problemas que exigem mais contexto.",
    action: "suporte@caballegacy.com",
    href: "mailto:suporte@caballegacy.com",
    icon: Mail,
    accent: "#19E0FF",
  },
] as const;

const faqItems = [
  {
    title: "Como criar uma conta?",
    body: "Use o botão Criar Conta no topo do portal, preencha seus dados e faça o primeiro login para liberar as rotas privadas.",
    icon: Shield,
  },
  {
    title: "Como reportar um bug?",
    body: "Envie o máximo de contexto possível pelo Discord ou por e-mail, incluindo horário, personagem e a rota em que o erro aconteceu.",
    icon: Bug,
  },
  {
    title: "Como tirar dúvidas sobre loja ou ALZ?",
    body: "Use o suporte por e-mail para questões mais detalhadas e o Discord para dúvidas rápidas sobre loja, marketplace e histórico de compras.",
    icon: CreditCard,
  },
] as const;

export default function SupportPage() {
  return (
    <PageShell>
      <section className="space-y-10">
        <div className="portal-panel px-6 py-8 sm:px-8 sm:py-10">
          <div className="max-w-3xl">
            <div className="portal-pill">Suporte</div>
            <h1 className="mt-6 text-4xl font-black tracking-tight text-white md:text-5xl">Central de suporte do portal</h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-[#A9B2C7]">
              Tire dúvidas, acompanhe orientações rápidas e use os canais oficiais do Cabal Legacy para resolver problemas de conta,
              loja, marketplace e acesso ao portal.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {contactChannels.map(({ title, description, action, href, icon: Icon, accent }) => (
            <a
              key={title}
              href={href}
              target={href.startsWith("http") ? "_blank" : undefined}
              rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="portal-panel group block px-6 py-6 transition-all duration-200 hover:-translate-y-1"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: `${accent}18` }}>
                  <Icon className="h-7 w-7" style={{ color: accent }} />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white">{title}</h2>
                  <p className="mt-2 text-sm leading-7 text-[#A9B2C7]">{description}</p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: accent }}>
                    {action}
                    <ExternalLink className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="portal-panel px-6 py-6">
            <div className="flex items-center gap-3">
              <HelpCircle className="h-5 w-5 text-[#19E0FF]" />
              <h2 className="text-2xl font-bold text-white">Perguntas frequentes</h2>
            </div>
            <div className="mt-6 space-y-4">
              {faqItems.map(({ title, body, icon: Icon }) => (
                <div key={title} className="portal-subpanel px-5 py-5">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-[#19E0FF]/10 text-[#19E0FF]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{title}</h3>
                      <p className="mt-2 text-sm leading-7 text-[#A9B2C7]">{body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="portal-panel px-6 py-6">
            <div className="portal-pill">Acesso rápido</div>
            <h2 className="mt-5 text-3xl font-black text-white">Precisa resolver agora?</h2>
            <p className="mt-4 text-sm leading-7 text-[#A9B2C7]">
              Use as rotas abaixo para voltar rápido às áreas onde normalmente surgem dúvidas de conta, loja e mercado.
            </p>
            <div className="mt-6 grid gap-3">
              <Button asChild size="lg" className="justify-between">
                <Link href="/conta">Abrir minha conta <ExternalLink className="h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="justify-between">
                <Link href="/loja">Ir para a loja <ExternalLink className="h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="justify-between">
                <Link href="/mercado">Ir para o mercado <ExternalLink className="h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
