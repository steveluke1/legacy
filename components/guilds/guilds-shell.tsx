"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, Shield, Users } from "lucide-react";

import { Input } from "@/components/ui/input";

interface GuildCharacterPreview {
  id: string;
  name: string;
  classCode: string;
  level: number;
}

interface GuildCardData {
  id: string;
  slug: string;
  name: string;
  faction: "Capella" | "Procyon";
  level: number;
  memberCount: number;
  recruiting: boolean;
  description: string;
  roster: GuildCharacterPreview[];
}

export function GuildsShell({ guilds }: { guilds: GuildCardData[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [factionFilter, setFactionFilter] = useState<"all" | "Capella" | "Procyon">("all");
  const [recruitingFilter, setRecruitingFilter] = useState<"all" | "recruiting" | "closed">("all");

  const filteredGuilds = useMemo(() => {
    return guilds.filter((guild) => {
      const matchesSearch = guild.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFaction = factionFilter === "all" || guild.faction === factionFilter;
      const matchesRecruiting =
        recruitingFilter === "all" ||
        (recruitingFilter === "recruiting" && guild.recruiting) ||
        (recruitingFilter === "closed" && !guild.recruiting);

      return matchesSearch && matchesFaction && matchesRecruiting;
    });
  }, [factionFilter, guilds, recruitingFilter, searchTerm]);

  return (
    <div className="mt-12 space-y-8">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="portal-subpanel px-6 py-5">
          <p className="portal-metric">Guildas ativas</p>
          <p className="portal-metric-value">{guilds.length}</p>
        </div>
        <div className="portal-subpanel px-6 py-5">
          <p className="portal-metric">Recrutando</p>
          <p className="portal-metric-value">{guilds.filter((guild) => guild.recruiting).length}</p>
        </div>
        <div className="portal-subpanel px-6 py-5">
          <p className="portal-metric">Maior roster</p>
          <p className="portal-metric-value">{Math.max(...guilds.map((guild) => guild.memberCount), 0)}</p>
        </div>
      </section>

      <section className="portal-panel overflow-hidden">
        <div className="border-b border-[#19E0FF]/10 px-6 py-5">
          <p className="portal-pill">Diretório de guildas</p>
          <h2 className="mt-4 text-3xl font-[family-name:var(--font-display)] text-white">Busca e filtros</h2>
          <p className="mt-2 text-sm leading-6 text-[#A9B2C7]">Explore facção, status de recrutamento e os principais nomes de cada aliança.</p>
        </div>

        <div className="grid gap-4 p-6 lg:grid-cols-[1.2fr_0.4fr_0.4fr]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8D98AF]" />
            <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar guilda..." className="pl-11" />
          </div>
          <select
            value={factionFilter}
            onChange={(event) => setFactionFilter(event.target.value as "all" | "Capella" | "Procyon")}
            className="flex h-11 w-full rounded-2xl border border-[#19E0FF]/16 bg-[#09121D] px-4 text-sm text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">Todas as facções</option>
            <option value="Capella">Capella</option>
            <option value="Procyon">Procyon</option>
          </select>
          <select
            value={recruitingFilter}
            onChange={(event) => setRecruitingFilter(event.target.value as "all" | "recruiting" | "closed")}
            className="flex h-11 w-full rounded-2xl border border-[#19E0FF]/16 bg-[#09121D] px-4 text-sm text-white shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="all">Todos os status</option>
            <option value="recruiting">Recrutando</option>
            <option value="closed">Fechadas</option>
          </select>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        {filteredGuilds.map((guild) => {
          const factionTone = guild.faction === "Capella" ? "#4A90D9" : "#D94A4A";
          return (
            <article key={guild.id} className="portal-panel overflow-hidden p-6 transition-transform duration-200 hover:-translate-y-1">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: `${factionTone}20` }}>
                    <Shield className="h-8 w-8" style={{ color: factionTone }} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-2xl font-black text-white">{guild.name}</h3>
                      <span className="rounded-full border px-3 py-1 text-xs font-medium" style={{ borderColor: `${factionTone}55`, color: factionTone }}>
                        {guild.faction}
                      </span>
                    </div>
                    <p className="mt-3 max-w-md text-sm leading-6 text-[#A9B2C7]">{guild.description}</p>
                  </div>
                </div>
                {guild.recruiting ? (
                  <span className="rounded-full border border-[#19E0FF]/30 bg-[#19E0FF]/12 px-3 py-1 text-xs font-bold text-[#19E0FF]">
                    Recrutando
                  </span>
                ) : null}
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="portal-subpanel px-4 py-4 text-center">
                  <p className="portal-metric">Nível</p>
                  <p className="mt-3 text-2xl font-black text-[#F7CE46]">Lv {guild.level}</p>
                </div>
                <div className="portal-subpanel px-4 py-4 text-center">
                  <Users className="mx-auto h-4 w-4 text-[#19E0FF]" />
                  <p className="mt-3 text-sm text-[#8D98AF]">Membros</p>
                  <p className="mt-1 text-xl font-black text-white">{guild.memberCount}</p>
                </div>
                <div className="portal-subpanel px-4 py-4 text-center">
                  <p className="portal-metric">Destaques</p>
                  <p className="mt-3 text-xl font-black text-white">{guild.roster.length}</p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {guild.roster.slice(0, 3).map((character) => (
                  <div key={character.id} className="portal-list-row">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-white">{character.name}</p>
                        <p className="mt-1 text-sm text-[#8D98AF]">
                          {character.classCode} · Lv {character.level}
                        </p>
                      </div>
                      <Link href={`/personagens/${character.id}`} className="portal-link">
                        Ver personagem
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex items-center justify-between gap-3 border-t border-[#19E0FF]/10 pt-4 text-sm text-[#8D98AF]">
                <span>{guild.recruiting ? "Guilda aberta para novos reforços." : "Guilda fechada para novas inscrições."}</span>
                <Link href={`/guildas/${guild.slug}`} className="portal-link">
                  Ver detalhes
                </Link>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
