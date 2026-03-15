import Link from "next/link";
import { ArrowLeftRight, Bell, Coins, Shield, ShoppingBag, Wallet, UserRound, Clock3 } from "lucide-react";

import { requireUserSession } from "@/server/auth/guards";
import { AccountService } from "@/server/services/account/accountService";
import { LogoutButton } from "@/components/auth/logout-button";
import { ChangePasswordForm } from "@/components/account/change-password-form";
import { PageShell } from "@/components/shared/page-shell";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/formatters";

const accountService = new AccountService();

export default async function AccountPage() {
  const session = await requireUserSession();
  const snapshot = await accountService.getAccountSnapshot(session.user!.id);

  const menuItems = [
    { title: "Carteira CASH", description: "Saldo e histórico de transações", icon: Wallet, color: "#19E0FF", href: "/loja" },
    { title: "Minhas compras", description: "Veja suas compras e o status no Mercado", icon: ShoppingBag, color: "#1A9FE8", href: "/mercado/compras" },
    { title: "Notificações", description: "Alertas do mercado, loja e conta", icon: Bell, color: "#F7CE46", href: "/notificacoes" },
    { title: "Alterar senha", description: "Proteja sua conta com uma senha forte", icon: Shield, color: "#F7CE46", href: "#senha" },
    { title: "Mercado ALZ", description: "Gerencie ordens e ofertas do servidor", icon: ArrowLeftRight, color: "#19E0FF", href: "/mercado" },
    { title: "Economia local", description: "Use CASH e ALZ no portal", icon: Coins, color: "#F7CE46", href: "/loja" },
  ] as const;

  return (
    <PageShell>
      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="portal-panel overflow-hidden p-8 lg:p-10">
          <Badge className="border-[#19E0FF]/24 bg-[#19E0FF]/10 text-[#19E0FF]">Conta</Badge>
          <div className="mt-6 flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#19E0FF] to-[#1A9FE8] text-[#05070B] shadow-[0_16px_40px_rgba(25,224,255,0.18)]">
              <UserRound className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-5xl font-black leading-[0.92] tracking-tight text-white md:text-6xl">Central do jogador: {session.user!.displayName}</h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-[#A9B2C7]">
                Gerencie carteira, mercado, notificações e segurança da conta em um painel visual inspirado na área privada do legado.
              </p>
            </div>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="portal-subpanel px-5 py-5 text-center">
              <p className="portal-metric">CASH disponível</p>
              <p className="portal-metric-value">{formatCurrency(snapshot.wallet?.cashBalance ?? 0, "cash")}</p>
            </div>
            <div className="portal-subpanel px-5 py-5 text-center">
              <p className="portal-metric">ALZ em carteira</p>
              <p className="portal-metric-value">{formatCurrency(snapshot.wallet?.alzBalance ?? 0, "alz")}</p>
            </div>
            <div className="portal-subpanel px-5 py-5 text-center">
              <p className="portal-metric">Premium ativo</p>
              <p className="mt-3 text-xl font-semibold text-white">
                {snapshot.wallet?.premiumTier === "gold" ? "Ouro" : snapshot.wallet?.premiumTier === "silver" ? "Prata" : "Nenhum"}
              </p>
            </div>
          </div>
        </div>

        <div className="portal-panel overflow-hidden p-8">
          <p className="portal-pill">Acesso rápido</p>
          <h2 className="mt-4 text-3xl font-[family-name:var(--font-display)] text-white">Painel privado</h2>
          <p className="mt-2 text-sm leading-6 text-[#A9B2C7]">Saída segura, atalhos do mercado e visão rápida do estado da conta.</p>
          <div className="mt-8 space-y-4">
            <div className="portal-list-row">
              <p className="text-sm text-[#8D98AF]">Sessão válida até</p>
              <div className="mt-2 flex items-center gap-2 text-lg font-semibold text-white"><Clock3 className="h-4 w-4 text-[#19E0FF]" />{formatDateTime(session.expiresAt)}</div>
            </div>
            <div className="portal-list-row">
              <p className="text-sm text-[#8D98AF]">Conta local</p>
              <p className="mt-2 text-lg font-semibold text-white">{session.user!.email}</p>
            </div>
            <LogoutButton endpoint="/api/auth/logout" redirectTo="/entrar">Sair da conta</LogoutButton>
          </div>
        </div>
      </section>

      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {menuItems.map((item) => (
          <Link key={item.title} href={item.href} className="portal-panel group overflow-hidden p-6 transition-transform duration-200 hover:-translate-y-1">
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: `${item.color}20` }}>
                <item.icon className="h-6 w-6" style={{ color: item.color }} />
              </div>
              <span className="text-sm text-[#A9B2C7] transition-colors group-hover:text-white">Abrir</span>
            </div>
            <h2 className="mt-6 text-xl font-bold text-white group-hover:text-[#19E0FF]">{item.title}</h2>
            <p className="mt-3 text-sm leading-6 text-[#A9B2C7]">{item.description}</p>
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="portal-panel overflow-hidden">
          <div className="border-b border-[#19E0FF]/10 px-6 py-5">
            <p className="portal-pill">Mercado ALZ</p>
            <h2 className="mt-4 text-3xl font-[family-name:var(--font-display)] text-white">Pedidos recentes</h2>
            <p className="mt-2 text-sm leading-6 text-[#A9B2C7]">Resumo visual das últimas compras registradas na sua conta local.</p>
          </div>
          <div className="space-y-3 p-6">
            {snapshot.marketOrders.length === 0 ? (
              <div className="portal-empty">Você ainda não fez compras de ALZ nesta conta.</div>
            ) : (
              snapshot.marketOrders.map((order) => (
                <div key={order.id} className="portal-list-row">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-white">{order.alzAmount.toLocaleString("pt-BR")} ALZ</p>
                      <p className="mt-1 text-sm text-[#8D98AF]">{formatDateTime(order.createdAt)}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="portal-metric">Status</p>
                      <p className="mt-2 font-semibold text-[#19E0FF]">{order.status}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section id="senha" className="portal-panel overflow-hidden">
          <div className="border-b border-[#19E0FF]/10 px-6 py-5">
            <p className="portal-pill">Segurança</p>
            <h2 className="mt-4 text-3xl font-[family-name:var(--font-display)] text-white">Trocar senha</h2>
            <p className="mt-2 text-sm leading-6 text-[#A9B2C7]">Atualize sua credencial local com o mesmo foco visual da área privada antiga.</p>
          </div>
          <div className="p-6">
            <ChangePasswordForm />
          </div>
        </section>
      </div>
    </PageShell>
  );
}
