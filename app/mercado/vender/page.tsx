import Link from "next/link";
import { Clock3, Shield } from "lucide-react";

import { CharacterRepository } from "@/server/repositories/characters/CharacterRepository";
import { UserAuthService } from "@/server/services/auth/userAuthService";
import { MarketplaceService } from "@/server/services/marketplace/marketplaceService";
import { PageShell } from "@/components/shared/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreateListingForm } from "@/components/marketplace/create-listing-form";

const authService = new UserAuthService();
const characterRepository = new CharacterRepository();
const marketplaceService = new MarketplaceService();

export default async function MarketplaceSellPage() {
  const session = await authService.getCurrentSession();
  const snapshot = await marketplaceService.getSnapshot(session?.user?.id);
  const characters = session?.user ? await characterRepository.listByOwnerUserId(session.user.id) : [];

  return (
    <PageShell>
      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="portal-panel overflow-hidden">
          <div className="border-b border-[#19E0FF]/10 px-6 py-5">
            <Badge className="border-[#FFD76A]/25 bg-[#2A2110]/70 text-[#FFD76A]">Anunciar ALZ</Badge>
            <h1 className="mt-4 text-5xl font-black leading-[0.92] tracking-tight text-white md:text-6xl">Nova oferta</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-[#A9B2C7]">
              Monte o lote e publique no mercado com personagem válido do servidor.
            </p>
          </div>
          <div className="p-6">
            {session?.user ? (
              <CreateListingForm characters={characters} />
            ) : (
              <div className="space-y-4">
                <p className="text-sm leading-6 text-[#A9B2C7]">Entre em sua conta para anunciar um lote com personagem válido.</p>
                <Button asChild>
                  <Link href="/entrar">Entrar para anunciar</Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="portal-panel overflow-hidden p-6">
            <Badge className="border-[#19E0FF]/24 bg-[#19E0FF]/10 text-[#19E0FF]">Resumo</Badge>
            <h2 className="mt-4 text-3xl font-[family-name:var(--font-display)] text-white">Status do mercado</h2>
            <div className="mt-6 grid gap-4">
              <div className="portal-subpanel p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[#8EA4C7]">Ofertas abertas</p>
                <p className="mt-2 text-3xl font-black text-white">{snapshot.listings.length}</p>
              </div>
              <div className="portal-subpanel p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[#8EA4C7]">Taxa local</p>
                <p className="mt-2 text-3xl font-black text-white">{snapshot.settings.feePercent}%</p>
              </div>
            </div>
          </section>

          <section className="portal-panel overflow-hidden p-6">
            <Badge className="border-[#19E0FF]/24 bg-[#19E0FF]/10 text-[#19E0FF]">Segurança</Badge>
            <h2 className="mt-4 text-3xl font-[family-name:var(--font-display)] text-white">Como funciona</h2>
            <div className="mt-6 grid gap-4">
              <div className="portal-subpanel p-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-[#19E0FF]" />
                  <p className="font-semibold text-white">Transação protegida</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#A9B2C7]">
                  As ofertas seguem o fluxo local do portal com validação de saldo e personagem.
                </p>
              </div>
              <div className="portal-subpanel p-4">
                <div className="flex items-center gap-3">
                  <Clock3 className="h-5 w-5 text-[#F7CE46]" />
                  <p className="font-semibold text-white">Liquidação previsível</p>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#A9B2C7]">
                  O tempo de liquidação permanece fixo e visível em cada card do mercado.
                </p>
              </div>
            </div>
          </section>

          <Button asChild variant="outline" className="w-full">
            <Link href="/mercado/ofertas">Ir para minhas ofertas</Link>
          </Button>
        </aside>
      </section>
    </PageShell>
  );
}
