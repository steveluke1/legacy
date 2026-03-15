import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, Shield, Trophy, Wallet } from "lucide-react";

import { UserAuthForm } from "@/components/auth/user-auth-form";
import { PageShell } from "@/components/shared/page-shell";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesso do jogador ao portal Cabal Legacy para conta, mercado, loja e notificações.",
};

export default async function UserLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ modo?: string; next?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const initialMode = params.modo === "register" ? "register" : "login";

  return (
    <PageShell>
      <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch">
        <section className="relative overflow-hidden rounded-[2rem] border border-[#19E0FF]/12 bg-[linear-gradient(180deg,rgba(4,10,18,0.96),rgba(5,8,14,0.98))] p-8 lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(25,224,255,0.12),transparent_24%),radial-gradient(circle_at_78%_26%,rgba(26,159,232,0.10),transparent_24%)]" />
          <div className="relative z-10 flex h-full flex-col">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#A9B2C7] transition-colors hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" /> Voltar ao início
            </Link>

            <div className="mt-8 flex items-center gap-3">
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#19E0FF] to-[#1A9FE8] text-xl font-black text-[#05070B]">
                  C
                </div>
                <div className="absolute inset-0 -z-10 rounded-lg bg-[#19E0FF]/30 blur-md" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-[0.08em] text-white">Cabal</span>
                <span className="-mt-0.5 text-xs font-semibold tracking-[0.12em] text-[#19E0FF]">Legacy</span>
              </div>
            </div>

            <div className="mt-10 space-y-5">
              <Badge className="border-[#19E0FF]/24 bg-[#19E0FF]/10 text-[#19E0FF]">Portal do jogador</Badge>
              <h1 className="text-5xl font-black leading-[0.92] tracking-tight text-white md:text-6xl">
                Entre para abrir sua conta e dominar o ecossistema do servidor.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[#A9B2C7]">
                Use suas credenciais para acompanhar rankings, guildas, loja, mercado e notificações no mesmo portal clássico.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="portal-subpanel px-5 py-5">
                <Wallet className="h-5 w-5 text-[#19E0FF]" />
                <p className="mt-5 font-semibold text-white">Carteira local</p>
                <p className="mt-2 text-sm leading-6 text-[#A9B2C7]">
                  Consulte saldo, compras e premium ativo sem sair do portal.
                </p>
              </div>
              <div className="portal-subpanel px-5 py-5">
                <Trophy className="h-5 w-5 text-[#F7CE46]" />
                <p className="mt-5 font-semibold text-white">Rankings ativos</p>
                <p className="mt-2 text-sm leading-6 text-[#A9B2C7]">
                  Veja poder, abates e corredores em destaque no mesmo ambiente.
                </p>
              </div>
              <div className="portal-subpanel px-5 py-5">
                <Shield className="h-5 w-5 text-[#19E0FF]" />
                <p className="mt-5 font-semibold text-white">Acesso seguro</p>
                <p className="mt-2 text-sm leading-6 text-[#A9B2C7]">
                  Sessão HTTP-only, redefinição local e fluxo de acesso enxuto.
                </p>
              </div>
            </div>

            <div className="mt-10 portal-panel overflow-hidden">
              <div className="border-b border-[#19E0FF]/10 px-6 py-5">
                <p className="portal-pill">Vantagens do portal</p>
                <h2 className="mt-4 text-3xl font-[family-name:var(--font-display)] text-white">
                  Tudo concentrado na conta do jogador
                </h2>
              </div>
              <div className="space-y-3 p-6 text-sm leading-7 text-[#A9B2C7]">
                <div className="portal-list-row">Entrar com sua conta de jogador e acessar a área privada em segundos.</div>
                <div className="portal-list-row">Criar cadastro local, recuperar senha e acompanhar alertas do sistema.</div>
                <div className="portal-list-row">Consultar mercado, loja premium, notificações e progresso geral do servidor.</div>
              </div>
            </div>
          </div>
        </section>

        <UserAuthForm initialMode={initialMode} />
      </div>
    </PageShell>
  );
}