import type { Metadata } from "next";
import Link from "next/link";
import { Activity, ChevronLeft, Shield, Users } from "lucide-react";

import { AdminAuthForm } from "@/components/auth/admin-auth-form";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/shared/page-shell";

export const metadata: Metadata = {
  title: "Entrar no painel",
  description: "Acesso administrativo do portal Cabal Legacy para monitoramento local de usuários, ofertas e pedidos.",
};

export default function AdminLoginPage() {
  return (
    <PageShell>
      <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-stretch">
        <section className="relative overflow-hidden rounded-[2rem] border border-[#F7CE46]/12 bg-[linear-gradient(180deg,rgba(10,8,14,0.96),rgba(6,7,11,0.98))] p-8 lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_22%,rgba(247,206,70,0.12),transparent_24%),radial-gradient(circle_at_78%_26%,rgba(255,75,106,0.12),transparent_24%)]" />
          <div className="relative z-10 flex h-full flex-col">
            <Link href="/entrar" className="inline-flex items-center gap-2 text-sm font-medium text-[#A9B2C7] transition-colors hover:text-white">
              <ChevronLeft className="h-4 w-4" /> Voltar para o acesso do usuário
            </Link>

            <div className="mt-8 space-y-5">
              <Badge className="border-[#F7CE46]/24 bg-[#F7CE46]/10 text-[#F7CE46]">Painel administrativo</Badge>
              <h1 className="text-5xl font-black leading-[0.92] tracking-tight text-white md:text-6xl">
                Entre para acompanhar usuários, ofertas e o ritmo operacional do servidor.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[#A9B2C7]">
                O acesso administrativo mantém a mesma atmosfera do portal principal, mas focado em monitoramento interno, contas sensíveis e circulação do mercado.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="portal-subpanel px-5 py-5">
                <Users className="h-5 w-5 text-[#19E0FF]" />
                <p className="mt-5 font-semibold text-white">Contas ativas</p>
                <p className="mt-2 text-sm leading-6 text-[#A9B2C7]">Acompanhe usuários, logins e carteiras em um painel único.</p>
              </div>
              <div className="portal-subpanel px-5 py-5">
                <Activity className="h-5 w-5 text-[#F7CE46]" />
                <p className="mt-5 font-semibold text-white">Mercado</p>
                <p className="mt-2 text-sm leading-6 text-[#A9B2C7]">Revise ofertas abertas e pedidos recentes com leitura rápida.</p>
              </div>
              <div className="portal-subpanel px-5 py-5">
                <Shield className="h-5 w-5 text-[#FF4B6A]" />
                <p className="mt-5 font-semibold text-white">Sessão segura</p>
                <p className="mt-2 text-sm leading-6 text-[#A9B2C7]">Fluxo administrativo local, sem dependência externa para autenticação.</p>
              </div>
            </div>
          </div>
        </section>

        <AdminAuthForm />
      </div>
    </PageShell>
  );
}
