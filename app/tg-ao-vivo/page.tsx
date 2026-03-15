import type { Metadata } from "next";
import { Activity, Clock3, Shield, Swords, Trophy, Users } from "lucide-react";

import { PageShell } from "@/components/shared/page-shell";

export const metadata: Metadata = {
  title: "TG ao Vivo",
  description: "Painel ao vivo da Guerra de Território com status, facções e destaques locais do Cabal Legacy.",
};

const liveEvents = [
  "Capella capturou a base central há 02 minutos.",
  "Procyon reagiu no corredor norte e segurou a bandeira.",
  "Escaramuças ativas nas torres laterais neste momento.",
];

const topPlayers = [
  { rank: 1, name: "Blade Vesper", faction: "Capella", score: 2850 },
  { rank: 2, name: "Astra Lyra", faction: "Procyon", score: 2640 },
  { rank: 3, name: "Iron Tiber", faction: "Capella", score: 2410 },
];

export default function TerritoryWarLivePage() {
  return (
    <PageShell>
      <section className="space-y-10">
        <div className="portal-panel px-6 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="portal-pill">TG ao Vivo</div>
              <h1 className="mt-6 text-4xl font-black tracking-tight text-white md:text-5xl">Guerra de território em tempo real</h1>
              <p className="mt-4 text-base leading-8 text-[#A9B2C7]">
                Acompanhe a disputa entre Capella e Procyon com o painel visual clássico do portal, status do confronto e destaques dos jogadores.
              </p>
            </div>
            <div className="portal-subpanel flex items-center gap-3 px-5 py-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#19E0FF]/12 text-[#19E0FF]">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#8EA4C7]">Status da batalha</p>
                <p className="mt-1 text-2xl font-black text-white">Ao vivo</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="portal-panel overflow-hidden">
            <div className="border-b border-[#19E0FF]/10 px-6 py-5 sm:px-8">
              <div className="flex items-center justify-between gap-4">
                <h2 className="flex items-center gap-2 text-2xl font-black text-white">
                  <Swords className="h-5 w-5 text-[#19E0FF]" /> Placar da guerra
                </h2>
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#8EA4C7]">
                  <Clock3 className="h-4 w-4" /> atualização local contínua
                </div>
              </div>
            </div>
            <div className="grid gap-4 p-6 md:grid-cols-2">
              <div className="portal-subpanel px-5 py-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF4B6A]/12 text-[#FF4B6A]">
                  <Shield className="h-7 w-7" />
                </div>
                <p className="mt-4 text-xs uppercase tracking-[0.18em] text-[#8EA4C7]">Capella</p>
                <p className="mt-3 text-5xl font-black text-white">8.750</p>
                <p className="mt-3 text-sm text-[#A9B2C7]">48 jogadores em campo</p>
              </div>
              <div className="portal-subpanel px-5 py-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#19E0FF]/12 text-[#19E0FF]">
                  <Shield className="h-7 w-7" />
                </div>
                <p className="mt-4 text-xs uppercase tracking-[0.18em] text-[#8EA4C7]">Procyon</p>
                <p className="mt-3 text-5xl font-black text-white">6.420</p>
                <p className="mt-3 text-sm text-[#A9B2C7]">52 jogadores em campo</p>
              </div>
            </div>
          </section>

          <section className="portal-panel overflow-hidden">
            <div className="border-b border-[#19E0FF]/10 px-6 py-5 sm:px-8">
              <h2 className="flex items-center gap-2 text-2xl font-black text-white">
                <Activity className="h-5 w-5 text-[#19E0FF]" /> Eventos recentes
              </h2>
            </div>
            <div className="space-y-3 p-6">
              {liveEvents.map((event) => (
                <div key={event} className="portal-subpanel px-4 py-4 text-sm leading-7 text-[#A9B2C7]">
                  {event}
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="portal-panel overflow-hidden">
          <div className="border-b border-[#19E0FF]/10 px-6 py-5 sm:px-8">
            <h2 className="flex items-center gap-2 text-2xl font-black text-white">
              <Trophy className="h-5 w-5 text-[#F7CE46]" /> Destaques da batalha
            </h2>
          </div>
          <div className="grid gap-4 p-6 md:grid-cols-3">
            {topPlayers.map((player) => (
              <div key={player.rank} className="portal-subpanel px-5 py-6 text-center">
                <p className="text-4xl font-black text-[#19E0FF]">#{player.rank}</p>
                <p className="mt-4 text-xl font-bold text-white">{player.name}</p>
                <p className="mt-2 text-sm text-[#A9B2C7]">{player.faction}</p>
                <div className="mt-5 rounded-xl border border-[#19E0FF]/10 bg-[#05070B]/70 px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[#8EA4C7]">Pontuação</p>
                  <p className="mt-2 text-2xl font-black text-white">{player.score.toLocaleString("pt-BR")}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="portal-subpanel px-5 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8EA4C7]">Facções ativas</p>
            <p className="mt-3 text-2xl font-black text-white">2</p>
          </div>
          <div className="portal-subpanel px-5 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8EA4C7]">Jogadores monitorados</p>
            <p className="mt-3 text-2xl font-black text-white">100</p>
          </div>
          <div className="portal-subpanel px-5 py-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[#8EA4C7]">Painel</p>
            <p className="mt-3 flex items-center gap-2 text-2xl font-black text-white"><Users className="h-5 w-5 text-[#19E0FF]" /> Canal principal</p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
