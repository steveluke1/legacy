import { requireAdminSession } from "@/server/auth/guards";
import { AdminDashboardService } from "@/server/services/admin/adminDashboardService";
import { MarketplaceRepository } from "@/server/repositories/marketplace/MarketplaceRepository";
import { UserRepository } from "@/server/repositories/users/UserRepository";
import { WalletRepository } from "@/server/repositories/wallets/WalletRepository";
import { LogoutButton } from "@/components/auth/logout-button";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/shared/page-shell";
import { formatCurrency } from "@/lib/formatters";

const adminDashboardService = new AdminDashboardService();
const marketplaceRepository = new MarketplaceRepository();
const userRepository = new UserRepository();
const walletRepository = new WalletRepository();

export default async function AdminPage() {
  const session = await requireAdminSession();
  const [summary, listings, orders, wallets] = await Promise.all([
    adminDashboardService.getSummary(),
    marketplaceRepository.listOpenListings(),
    marketplaceRepository.listOrders(),
    walletRepository.list(),
  ]);
  const accounts = (
    await Promise.all([
      userRepository.findById("user_demo_buyer"),
      userRepository.findById("user_demo_seller"),
      userRepository.findById("user_demo_neutral"),
    ])
  ).filter(Boolean);

  return (
    <PageShell>
      <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-4">
          <Badge className="border-[#F7CE46]/24 bg-[#F7CE46]/10 text-[#F7CE46]">Painel</Badge>
          <h1 className="text-5xl font-black leading-[0.92] tracking-tight text-white md:text-6xl">Operação administrativa de {session.admin?.displayName}</h1>
          <p className="max-w-2xl text-lg leading-8 text-[#A9B2C7]">
            Monitore contas, ofertas, pedidos e circulação interna do servidor em uma leitura mais próxima do portal antigo.
          </p>
        </div>
        <LogoutButton endpoint="/api/admin/auth/logout" redirectTo="/admin/entrar">Encerrar sessão</LogoutButton>
      </section>

      <div className="mt-8 grid gap-4 xl:grid-cols-4">
        <div className="portal-subpanel px-5 py-4"><p className="portal-metric">Usuários ativos</p><p className="portal-metric-value">{summary.activeUsers}</p></div>
        <div className="portal-subpanel px-5 py-4"><p className="portal-metric">Ofertas abertas</p><p className="portal-metric-value">{summary.openListings}</p></div>
        <div className="portal-subpanel px-5 py-4"><p className="portal-metric">Cash em circulação</p><p className="mt-3 text-xl font-semibold text-white">{formatCurrency(summary.totalCashInCirculation, "cash")}</p></div>
        <div className="portal-subpanel px-5 py-4"><p className="portal-metric">ALZ em circulação</p><p className="mt-3 text-xl font-semibold text-white">{formatCurrency(summary.totalAlzInCirculation, "alz")}</p></div>
      </div>

      <div className="mt-10 grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <section className="portal-panel overflow-hidden">
          <div className="border-b border-[#19E0FF]/10 px-6 py-5">
            <Badge>Contas monitoradas</Badge>
            <h2 className="mt-4 text-3xl font-[family-name:var(--font-display)] text-white">Jogadores rastreados</h2>
          </div>
          <div className="space-y-3 p-6">
            {accounts.map((account) => {
              const wallet = wallets.find((entry) => entry.userId === account!.id);
              return (
                <div key={account!.id} className="portal-list-row">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-white">{account!.displayName}</p>
                      <p className="mt-1 text-sm text-[#8D98AF]">{account!.email}</p>
                    </div>
                    <div className="text-right text-sm text-[#A9B2C7]">
                      <p>{formatCurrency(wallet?.cashBalance ?? 0, "cash")}</p>
                      <p>{formatCurrency(wallet?.alzBalance ?? 0, "alz")}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="space-y-6">
          <section className="portal-panel overflow-hidden">
            <div className="border-b border-[#19E0FF]/10 px-6 py-5">
              <Badge className="border-[#FFD76A]/25 bg-[#2A2110]/70 text-[#FFD76A]">Mercado</Badge>
              <h2 className="mt-4 text-3xl font-[family-name:var(--font-display)] text-white">Ofertas abertas</h2>
            </div>
            <div className="space-y-3 p-6">
              {listings.map((listing) => (
                <div key={listing.id} className="portal-list-row text-sm text-[#A9B2C7]">
                  <p className="font-semibold text-white">{listing.title}</p>
                  <p className="mt-1">{listing.sellerName} · {listing.alzAmount.toLocaleString("pt-BR")} ALZ</p>
                </div>
              ))}
            </div>
          </section>

          <section className="portal-panel overflow-hidden">
            <div className="border-b border-[#19E0FF]/10 px-6 py-5">
              <Badge>Pedidos</Badge>
              <h2 className="mt-4 text-3xl font-[family-name:var(--font-display)] text-white">Histórico recente</h2>
            </div>
            <div className="space-y-3 p-6">
              {orders.length === 0 ? (
                <div className="portal-empty">Nenhum pedido registrado até o momento.</div>
              ) : orders.map((order) => (
                <div key={order.id} className="portal-list-row text-sm text-[#A9B2C7]">
                  <p className="font-semibold text-white">{order.sellerName}</p>
                  <p className="mt-1">{order.alzAmount.toLocaleString("pt-BR")} ALZ · {order.status}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
