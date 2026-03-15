import { requireUserSession } from "@/server/auth/guards";
import { MarketplaceRepository } from "@/server/repositories/marketplace/MarketplaceRepository";
import { PageShell } from "@/components/shared/page-shell";
import { formatCurrency, formatDateTime } from "@/lib/formatters";

const marketplaceRepository = new MarketplaceRepository();

export default async function MyOrdersPage() {
  const session = await requireUserSession();
  const orders = (await marketplaceRepository.listOrders()).filter((order) => order.buyerUserId === session.user!.id);

  return (
    <PageShell>
      <section className="space-y-5">
        <p className="portal-pill">Mercado ALZ</p>
        <h1 className="text-5xl font-black leading-[0.92] tracking-tight text-white md:text-6xl">Minhas compras</h1>
        <p className="max-w-3xl text-lg leading-8 text-[#A9B2C7]">
          Acompanhe pedidos, valores e liquidacao em um painel no estilo do mercado antigo.
        </p>
      </section>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="portal-subpanel px-5 py-4"><p className="portal-metric">Pedidos</p><p className="portal-metric-value">{orders.length}</p></div>
        <div className="portal-subpanel px-5 py-4"><p className="portal-metric">Status</p><p className="portal-metric-value">Local</p></div>
        <div className="portal-subpanel px-5 py-4"><p className="portal-metric">Mercado</p><p className="portal-metric-value">ALZ</p></div>
      </div>

      <div className="mt-10 space-y-4">
        {orders.length === 0 ? (
          <div className="portal-empty">Nenhuma compra encontrada ate o momento.</div>
        ) : (
          orders.map((order) => (
            <article key={order.id} className="portal-panel overflow-hidden p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#8EA4C7]">Pedido {order.id}</p>
                  <p className="mt-3 text-3xl font-bold text-white">{order.alzAmount.toLocaleString("pt-BR")} ALZ</p>
                  <p className="mt-2 text-sm text-[#A9B2C7]">Registrado em {formatDateTime(order.createdAt)}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
                  <div className="portal-subpanel px-4 py-4"><p className="text-xs uppercase tracking-[0.16em] text-[#8EA4C7]">Valor</p><p className="mt-2 text-lg font-semibold text-white">{formatCurrency(order.grossBrl)}</p></div>
                  <div className="portal-subpanel px-4 py-4"><p className="text-xs uppercase tracking-[0.16em] text-[#8EA4C7]">Taxa</p><p className="mt-2 text-lg font-semibold text-white">{formatCurrency(order.marketFeeBrl)}</p></div>
                  <div className="portal-subpanel px-4 py-4"><p className="text-xs uppercase tracking-[0.16em] text-[#8EA4C7]">Status</p><p className="mt-2 text-lg font-semibold text-white">{order.status}</p></div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </PageShell>
  );
}