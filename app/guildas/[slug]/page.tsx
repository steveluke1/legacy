import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, ChevronLeft, Crown, Shield, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/shared/page-shell";
import { getGuildDetailData } from "@/server/queries/appQueries";

export default async function GuildDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getGuildDetailData(slug);

  if (!data) notFound();

  const factionTone = data.guild.faction === "Capella" ? "#4A90D9" : "#D94A4A";

  return (
    <PageShell>
      <div className="space-y-8">
        <Link
          href="/guildas"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#A9B2C7] transition-colors hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" /> Voltar para guildas
        </Link>

        <section className="portal-panel overflow-hidden p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl" style={{ backgroundColor: `${factionTone}20` }}>
                  <Shield className="h-12 w-12" style={{ color: factionTone }} />
                </div>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge className="border-none text-white" style={{ backgroundColor: `${factionTone}22`, color: factionTone }}>
                      {data.guild.faction}
                    </Badge>
                    <Badge className="border-[#F7CE46]/30 bg-[#F7CE46]/15 text-[#F7CE46]">Lv {data.guild.level}</Badge>
                    {data.guild.recruiting ? (
                      <Badge className="border-[#19E0FF]/30 bg-[#19E0FF]/15 text-[#19E0FF]">Recrutando</Badge>
                    ) : null}
                  </div>
                  <h1 className="font-[family-name:var(--font-display)] text-5xl leading-[0.92] tracking-tight text-white sm:text-6xl">
                    {data.guild.name}
                  </h1>
                </div>
              </div>

              <p className="max-w-2xl text-lg leading-8 text-[#A9B2C7]">{data.guild.description}</p>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="portal-subpanel px-5 py-5 text-center">
                  <p className="portal-metric">Nivel</p>
                  <p className="portal-metric-value">{data.guild.level}</p>
                </div>
                <div className="portal-subpanel px-5 py-5 text-center">
                  <p className="portal-metric">Membros</p>
                  <p className="portal-metric-value">{data.guild.memberCount}</p>
                </div>
                <div className="portal-subpanel px-5 py-5 text-center">
                  <p className="portal-metric">Estado</p>
                  <p className="mt-3 text-xl font-semibold text-white">{data.guild.recruiting ? "Aberta" : "Fechada"}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="portal-subpanel px-6 py-6">
                <div className="flex items-center gap-3 text-sm text-[#A9B2C7]">
                  <Crown className="h-4 w-4 text-[#F7CE46]" />
                  <span>Alianca ativa do servidor local</span>
                </div>
                <div className="mt-4 flex items-center gap-3 text-sm text-[#A9B2C7]">
                  <Users className="h-4 w-4 text-[#19E0FF]" />
                  <span>{data.roster.length} personagens destacados nesta formacao</span>
                </div>
                <div className="mt-4 flex items-center gap-3 text-sm text-[#A9B2C7]">
                  <Calendar className="h-4 w-4 text-[#19E0FF]" />
                  <span>{data.guild.recruiting ? "Aceitando novos reforcos" : "Recrutamento temporariamente fechado"}</span>
                </div>
                {data.guild.recruiting ? (
                  <Button type="button" className="mt-6 w-full">Solicitar entrada</Button>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <section className="portal-panel overflow-hidden">
          <div className="border-b border-[#19E0FF]/10 px-6 py-5">
            <p className="portal-pill">Elenco da guilda</p>
            <h2 className="mt-4 text-3xl font-[family-name:var(--font-display)] text-white">Linha de frente</h2>
            <p className="mt-2 text-sm leading-6 text-[#A9B2C7]">
              Os personagens abaixo representam a base ativa e competitiva da alianca.
            </p>
          </div>
          <div className="space-y-3 p-6">
            {data.roster.map((character) => (
              <div key={character.id} className="portal-list-row">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-white">{character.name}</p>
                    <p className="mt-1 text-sm text-[#8D98AF]">
                      {character.classCode} · Lv {character.level} · {character.nation}
                    </p>
                  </div>
                  <Link href={`/personagens/${character.id}`} className="portal-link">
                    Ver personagem
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}