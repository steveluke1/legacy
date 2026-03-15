import Link from "next/link";
import { ChevronRight, DollarSign, Package, ShoppingCart } from "lucide-react";

import { PageShell } from "@/components/shared/page-shell";
import { Button } from "@/components/ui/button";

export default function MarketplacePage() {
  return (
    <PageShell>
      <section className="space-y-8">
        <header className="space-y-4 text-center">
          <h1 className="text-5xl font-black leading-tight text-white md:text-6xl">Mercado</h1>
          <p className="mx-auto max-w-3xl text-lg text-[#B1BDD6]">Compre e venda ALZ, itens e serviços in-game com segurança</p>
          <div className="mx-auto h-1 w-24 rounded-full bg-[#19E0FF]" />
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <article className="portal-panel p-8 text-center">
            <ShoppingCart className="mx-auto h-16 w-16 text-[#19E0FF]" />
            <h2 className="mt-5 text-5xl font-black leading-none text-white md:text-[42px]">Comprar ALZ</h2>
            <p className="mt-4 text-lg leading-8 text-[#A9B2C7]">
              Veja os melhores preços e compre ALZ com PIX de forma rápida e segura
            </p>
            <Button asChild className="mt-7 h-12 w-full text-xl font-bold">
              <Link href="/mercado/comprar">Ver ofertas de ALZ</Link>
            </Button>
          </article>

          <article className="portal-panel p-8 text-center">
            <DollarSign className="mx-auto h-16 w-16 text-[#F7CE46]" />
            <h2 className="mt-5 text-5xl font-black leading-none text-white md:text-[42px]">Vender ALZ</h2>
            <p className="mt-4 text-lg leading-8 text-[#A9B2C7]">
              Anuncie seu ALZ e receba via PIX quando houver compradores interessados
            </p>
            <Button asChild className="mt-7 h-12 w-full bg-[#F7CE46] text-xl font-bold text-[#111315] hover:bg-[#f6d96f]">
              <Link href="/mercado/vender">Anunciar meu ALZ</Link>
            </Button>
          </article>
        </section>

        <Link
          href="/mercado/ofertas"
          className="portal-panel block p-6 transition-colors hover:border-[#19E0FF]/40"
          aria-label="Abrir minhas ofertas"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Package className="h-9 w-9 text-[#19E0FF]" />
              <div>
                <h2 className="text-3xl font-black leading-tight text-white">Minhas Ofertas</h2>
                <p className="mt-1 text-base text-[#A9B2C7]">Acompanhe e gerencie suas ofertas de venda</p>
              </div>
            </div>
            <ChevronRight className="h-6 w-6 text-[#9DB1D2]" />
          </div>
        </Link>
      </section>
    </PageShell>
  );
}
