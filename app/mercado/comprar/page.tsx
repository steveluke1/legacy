import Link from "next/link";
import { Coins } from "lucide-react";

import { CharacterRepository } from "@/server/repositories/characters/CharacterRepository";
import { UserAuthService } from "@/server/services/auth/userAuthService";
import { MarketplaceService } from "@/server/services/marketplace/marketplaceService";
import { formatCurrency } from "@/lib/formatters";
import { PageShell } from "@/components/shared/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PurchaseButton } from "@/components/marketplace/purchase-button";

const authService = new UserAuthService();
const characterRepository = new CharacterRepository();
const marketplaceService = new MarketplaceService();

export default async function MarketplaceBuyPage() {
  const session = await authService.getCurrentSession();
  const snapshot = await marketplaceService.getSnapshot(session?.user?.id);
  const characters = session?.user ? await characterRepository.listByOwnerUserId(session.user.id) : [];

  return (
    <PageShell>
      <section className="space-y-6">
        <header className="space-y-4">
          <p className="portal-pill">Comprar ALZ</p>
          <h1 className="text-5xl font-black leading-[0.92] tracking-tight text-white md:text-6xl">Mural do mercado</h1>
          <p className="max-w-3xl text-lg leading-8 text-[#A9B2C7]">
            Veja os lotes ativos, compare valores e conclua a compra com personagem válido.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="portal-subpanel px-5 py-5 text-center">
            <p className="portal-metric">Ofertas abertas</p>
            <p className="portal-metric-value">{snapshot.listings.length}</p>
          </div>
          <div className="portal-subpanel px-5 py-5 text-center">
            <p className="portal-metric">Taxa do mercado</p>
            <p className="portal-metric-value">{snapshot.settings.feePercent}%</p>
          </div>
          <div className="portal-subpanel px-5 py-5 text-center">
            <p className="portal-metric">Liquidação</p>
            <p className="portal-metric-value">{snapshot.settings.settlementWindowHours}h</p>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          {snapshot.listings.map((listing) => (
            <article
              key={listing.id}
              className="portal-subpanel overflow-hidden p-5 transition-all hover:border-[#19E0FF]/40 hover:shadow-[0_20px_50px_rgba(25,224,255,0.12)]"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#19E0FF]/12">
                    <Coins className="h-5 w-5 text-[#19E0FF]" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-[#8D98AF]">Vendedor</p>
                    <p className="mt-1 font-semibold text-white">{listing.sellerName}</p>
                  </div>
                </div>
                <Badge>{listing.title}</Badge>
              </div>

              <p className="text-3xl font-black text-[#19E0FF]">{listing.alzAmount.toLocaleString("pt-BR")} ALZ</p>
              <p className="mt-2 text-xs text-[#A9B2C7]">{formatCurrency(listing.unitPriceBrl * 1000)} por 1K ALZ</p>
              <p className="mt-4 text-sm leading-6 text-[#A9B2C7]">{listing.description}</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[#19E0FF]/12 bg-[#08111B] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#8D98AF]">Preço total</p>
                  <p className="mt-2 text-2xl font-black text-white">{formatCurrency(listing.unitPriceBrl * listing.alzAmount)}</p>
                </div>
                <div className="rounded-xl border border-[#19E0FF]/12 bg-[#08111B] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#8D98AF]">Liquidação</p>
                  <p className="mt-2 text-xl font-semibold text-white">{snapshot.settings.settlementWindowHours}h</p>
                </div>
              </div>

              <div className="mt-5">
                {session?.user ? (
                  <PurchaseButton listing={listing} characters={characters} />
                ) : (
                  <Button asChild className="w-full">
                    <Link href="/entrar">Entrar para comprar</Link>
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/mercado">Voltar ao mercado</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/mercado/compras">Minhas compras</Link>
          </Button>
        </div>
      </section>
    </PageShell>
  );
}
