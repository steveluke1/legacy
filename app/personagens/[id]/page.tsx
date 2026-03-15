import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Shield, Sword, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/shared/page-shell";
import { getCharacterDetailData } from "@/server/queries/appQueries";

export default async function CharacterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const character = await getCharacterDetailData(id);

  if (!character) notFound();

  return (
    <PageShell>
      <div className="space-y-8">
        <Link href="/rankings" className="inline-flex items-center gap-2 text-sm font-medium text-[#A9B2C7] transition-colors hover:text-white">
          <ChevronLeft className="h-4 w-4" /> Voltar para o ranking
        </Link>

        <section className="portal-panel overflow-hidden p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#19E0FF] to-[#1A9FE8] text-2xl font-black text-[#05070B]">
                  {character.classCode}
                </div>
                <div className="space-y-2">
                  <Badge>{character.classCode}</Badge>
                  <h1 className="font-[family-name:var(--font-display)] text-5xl leading-[0.92] tracking-tight text-white sm:text-6xl">{character.name}</h1>
                </div>
              </div>
              <p className="max-w-2xl text-lg leading-8 text-[#A9B2C7]">{character.headline}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="portal-subpanel px-5 py-5">
                  <p className="portal-metric">Poder</p>
                  <p className="portal-metric-value">{character.battlePower.toLocaleString("pt-BR")}</p>
                </div>
                <div className="portal-subpanel px-5 py-5">
                  <p className="portal-metric">Honra</p>
                  <p className="mt-3 text-xl font-semibold text-white">{character.honorLevel}</p>
                </div>
                <div className="portal-subpanel px-5 py-5">
                  <p className="portal-metric">Nação</p>
                  <p className="mt-3 text-xl font-semibold text-white">{character.nation}</p>
                </div>
                <div className="portal-subpanel px-5 py-5">
                  <p className="portal-metric">Guilda</p>
                  <p className="mt-3 text-xl font-semibold text-white">{character.guildName ?? "Sem guilda"}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="portal-list-row">
                <p className="portal-metric">Ataque</p>
                <p className="mt-3 text-2xl font-bold text-[#19E0FF]">{character.stats.attack.toLocaleString("pt-BR")}</p>
              </div>
              <div className="portal-list-row">
                <p className="portal-metric">Defesa</p>
                <p className="mt-3 text-2xl font-bold text-[#19E0FF]">{character.stats.defense.toLocaleString("pt-BR")}</p>
              </div>
              <div className="portal-list-row">
                <p className="portal-metric">Crítico</p>
                <p className="mt-3 text-2xl font-bold text-white">{character.stats.criticalRate}%</p>
              </div>
              <div className="portal-list-row">
                <p className="portal-metric">Precisão</p>
                <p className="mt-3 text-2xl font-bold text-white">{character.stats.accuracy}%</p>
              </div>
              <div className="portal-subpanel p-5 sm:col-span-2">
                <div className="flex flex-wrap items-center gap-3 text-sm text-[#A9B2C7]">
                  <Shield className="h-4 w-4 text-[#19E0FF]" />
                  <span>Perfil sincronizado a partir dos dados locais do servidor.</span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[#A9B2C7]">
                  <Sword className="h-4 w-4 text-[#F7CE46]" />
                  <span>Resumo de combate e histórico no padrão visual do legado.</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {character.achievements.map((achievement) => (
                    <Badge key={achievement} className="border-[#19E0FF]/14 bg-[#0C1726] text-[#D7F7FF]">{achievement}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="portal-panel overflow-hidden">
          <div className="border-b border-[#19E0FF]/10 px-6 py-5">
            <p className="portal-pill">Ficha do personagem</p>
            <h2 className="mt-4 text-3xl font-[family-name:var(--font-display)] text-white">Atributos e histórico</h2>
            <p className="mt-2 text-sm leading-6 text-[#A9B2C7]">Resumo de combate, atributos e marcos recentes da jornada deste personagem.</p>
          </div>
          <div className="space-y-6 p-6">
            <div className="portal-subpanel px-5 py-5">
              <p className="portal-metric">Biografia</p>
              <p className="mt-3 text-sm leading-7 text-[#A9B2C7]">{character.biography}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="portal-list-row">
                <Trophy className="h-5 w-5 text-[#F7CE46]" />
                <p className="mt-4 font-semibold text-white">Conquistas</p>
                <p className="mt-2 text-sm text-[#A9B2C7]">{character.achievements.length} marcos registrados no portal.</p>
              </div>
              <div className="portal-list-row">
                <Shield className="h-5 w-5 text-[#19E0FF]" />
                <p className="mt-4 font-semibold text-white">Nação</p>
                <p className="mt-2 text-sm text-[#A9B2C7]">{character.nation}</p>
              </div>
              <div className="portal-list-row">
                <Sword className="h-5 w-5 text-[#FF4B6A]" />
                <p className="mt-4 font-semibold text-white">Classe</p>
                <p className="mt-2 text-sm text-[#A9B2C7]">{character.classCode}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
