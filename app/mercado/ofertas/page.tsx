import { requireUserSession } from "@/server/auth/guards";
import { MarketplaceRepository } from "@/server/repositories/marketplace/MarketplaceRepository";
import { PageShell } from "@/components/shared/page-shell";

const marketplaceRepository = new MarketplaceRepository();

export default async function MyListingsPage() {
  const session = await requireUserSession();
  const listings = (await marketplaceRepository.listListings()).filter((listing) => listing.sellerUserId === session.user!.id);

  return (
    <PageShell>
      <section className="space-y-5">
        <p className="portal-pill">Mercado ALZ</p>
        <h1 className="text-5xl font-black leading-[0.92] tracking-tight text-white md:text-6xl">Minhas ofertas</h1>
        <p className="max-w-3xl text-lg leading-8 text-[#A9B2C7]">
          Consulte seus anuncios ativos e acompanhe o status de cada lote publicado.
        </p>
      </section>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="portal-subpanel px-5 py-4"><p className="portal-metric">Ofertas</p><p className="portal-metric-value">{listings.length}</p></div>
        <div className="portal-subpanel px-5 py-4"><p className="portal-metric">Status</p><p className="portal-metric-value">Painel local</p></div>
        <div className="portal-subpanel px-5 py-4"><p className="portal-metric">Mercado</p><p className="portal-metric-value">Ativo</p></div>
      </div>

      <div className="mt-10 space-y-4">
        {listings.length === 0 ? (
          <div className="portal-empty">Voce ainda nao publicou ofertas no mercado.</div>
        ) : (
          listings.map((listing) => (
            <article key={listing.id} className="portal-panel overflow-hidden p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">{listing.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#A9B2C7]">{listing.description}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
                  <div className="portal-subpanel px-4 py-4"><p className="text-xs uppercase tracking-[0.16em] text-[#8EA4C7]">Volume</p><p className="mt-2 text-lg font-semibold text-white">{listing.alzAmount.toLocaleString("pt-BR")} ALZ</p></div>
                  <div className="portal-subpanel px-4 py-4"><p className="text-xs uppercase tracking-[0.16em] text-[#8EA4C7]">Status</p><p className="mt-2 text-lg font-semibold text-white">{listing.status}</p></div>
                  <div className="portal-subpanel px-4 py-4"><p className="text-xs uppercase tracking-[0.16em] text-[#8EA4C7]">Anuncio</p><p className="mt-2 text-lg font-semibold text-white">Ativo</p></div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </PageShell>
  );
}