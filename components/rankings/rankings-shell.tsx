"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Medal, Shield, Swords, Zap } from "lucide-react";

import type { RankingDataset, RankingEntry } from "@/lib/types/ranking";

interface GuildRankingEntry {
  id: string;
  slug: string;
  name: string;
  faction: "Capella" | "Procyon";
  level: number;
  memberCount: number;
}

const CLASS_LABELS: Record<string, string> = {
  WA: "Guerreiro",
  BL: "Espadachim",
  WI: "Mago",
  FA: "Arqueiro Arcano",
  FS: "Guardião Arcano",
  FB: "Espadachim Arcano",
  FG: "Atirador Arcano",
};

type TabKey = "POWER" | "TG" | "GUILDS";

const TAB_META: Record<
  TabKey,
  {
    label: string;
    icon: typeof Zap;
    title: string;
    subtitle: string;
    metricHeader: string;
    rowMetric: (entry: RankingEntry) => string;
    activeClass: string;
  }
> = {
  POWER: {
    label: "Poder",
    icon: Zap,
    title: "Ranking de Poder",
    subtitle: "Os personagens mais fortes do servidor.",
    metricHeader: "Poder",
    rowMetric: (entry) => entry.battlePower.toLocaleString("pt-BR"),
    activeClass: "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#19E0FF] data-[state=active]:to-[#1A9FE8] data-[state=active]:text-[#05070B]",
  },
  TG: {
    label: "TG",
    icon: Swords,
    title: "Ranking TG",
    subtitle: "Os guerreiros com mais vitórias na TG da semana.",
    metricHeader: "Vitórias",
    rowMetric: (entry) => String(entry.weeklyKills),
    activeClass: "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FF4B6A] data-[state=active]:to-[#FF6B8A] data-[state=active]:text-white",
  },
  GUILDS: {
    label: "Guildas",
    icon: Shield,
    title: "Ranking de Guildas",
    subtitle: "As guildas mais influentes de Nevareth.",
    metricHeader: "Nível",
    rowMetric: () => "",
    activeClass: "data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#1A9FE8] data-[state=active]:to-[#19E0FF] data-[state=active]:text-[#05070B]",
  },
};

function medalColor(position: number) {
  if (position === 1) return "#FFD700";
  if (position === 2) return "#C0C0C0";
  if (position === 3) return "#CD7F32";
  return "#A9B2C7";
}

function PositionCell({ position }: { position: number }) {
  if (position <= 3) {
    return (
      <div className="flex h-8 w-8 items-center justify-center">
        <Medal className="h-6 w-6" style={{ color: medalColor(position) }} />
      </div>
    );
  }
  return <span className="font-medium text-[#A9B2C7]">{position}</span>;
}

function PlayerTable({
  entries,
  metricHeader,
  rowMetric,
}: {
  entries: RankingEntry[];
  metricHeader: string;
  rowMetric: (entry: RankingEntry) => string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px]">
        <thead>
          <tr className="border-b border-[#19E0FF]/10">
            <th className="px-4 py-4 text-left text-sm font-medium text-[#A9B2C7]">#</th>
            <th className="px-4 py-4 text-left text-sm font-medium text-[#A9B2C7]">Jogador</th>
            <th className="px-4 py-4 text-left text-sm font-medium text-[#A9B2C7]">Classe</th>
            <th className="px-4 py-4 text-left text-sm font-medium text-[#A9B2C7]">Guilda</th>
            <th className="px-4 py-4 text-right text-sm font-medium text-[#A9B2C7]">{metricHeader}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={`${entry.characterId}_${metricHeader}`} className="border-b border-[#19E0FF]/5 transition-colors hover:bg-[#19E0FF]/5 last:border-b-0">
              <td className="px-4 py-4">
                <PositionCell position={entry.position} />
              </td>
              <td className="px-4 py-4">
                <div className="space-y-1">
                  <Link href={`/personagens/${entry.characterId}`} className="font-medium text-white hover:text-[#19E0FF]">
                    {entry.characterName}
                  </Link>
                  <div>
                    <Link href={`/personagens/${entry.characterId}`} className="text-xs font-semibold text-[#19E0FF] hover:text-white">
                      Ver personagem
                    </Link>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 text-sm text-[#19E0FF]">{CLASS_LABELS[entry.classCode] ?? entry.classCode}</td>
              <td className="px-4 py-4 text-sm text-[#F7CE46]">{entry.guildName ?? "-"}</td>
              <td className="px-4 py-4 text-right text-sm font-bold text-white">{rowMetric(entry)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GuildTable({ guilds }: { guilds: GuildRankingEntry[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px]">
        <thead>
          <tr className="border-b border-[#19E0FF]/10">
            <th className="px-4 py-4 text-left text-sm font-medium text-[#A9B2C7]">#</th>
            <th className="px-4 py-4 text-left text-sm font-medium text-[#A9B2C7]">Guilda</th>
            <th className="px-4 py-4 text-left text-sm font-medium text-[#A9B2C7]">Facção</th>
            <th className="px-4 py-4 text-right text-sm font-medium text-[#A9B2C7]">Nível</th>
          </tr>
        </thead>
        <tbody>
          {guilds.map((guild, index) => (
            <tr key={guild.id} className="border-b border-[#19E0FF]/5 transition-colors hover:bg-[#19E0FF]/5 last:border-b-0">
              <td className="px-4 py-4">
                <PositionCell position={index + 1} />
              </td>
              <td className="px-4 py-4">
                <Link href={`/guildas/${guild.slug}`} className="font-medium text-white hover:text-[#19E0FF]">
                  {guild.name}
                </Link>
              </td>
              <td className="px-4 py-4">
                <span
                  className={
                    guild.faction === "Capella"
                      ? "rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400"
                      : "rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-medium text-red-400"
                  }
                >
                  {guild.faction}
                </span>
              </td>
              <td className="px-4 py-4 text-right text-lg font-bold text-[#F7CE46]">Lv {guild.level}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RankingsShell({ rankings, guilds }: { rankings: RankingDataset; guilds: GuildRankingEntry[] }) {
  const [activeTab, setActiveTab] = useState<TabKey>("POWER");

  const tabButtons: Array<{ key: TabKey; label: string; icon: typeof Zap; activeClass: string }> = [
    { key: "POWER", label: TAB_META.POWER.label, icon: TAB_META.POWER.icon, activeClass: TAB_META.POWER.activeClass },
    { key: "TG", label: TAB_META.TG.label, icon: TAB_META.TG.icon, activeClass: TAB_META.TG.activeClass },
    { key: "GUILDS", label: TAB_META.GUILDS.label, icon: TAB_META.GUILDS.icon, activeClass: TAB_META.GUILDS.activeClass },
  ];

  const activeEntries = useMemo(() => {
    if (activeTab === "POWER") return rankings.power;
    if (activeTab === "TG") return rankings.weeklyKillers;
    return [];
  }, [activeTab, rankings]);

  return (
    <div className="mt-12 space-y-8">
      <section className="text-center">
        <h2 className="text-4xl font-black text-white md:text-5xl">{TAB_META[activeTab].title}</h2>
        <p className="mx-auto mt-3 max-w-3xl text-lg text-[#A9B2C7]">{TAB_META[activeTab].subtitle}</p>
      </section>

      <section className="portal-panel p-6">
        <div className="mb-6 grid w-full grid-cols-3 gap-2 rounded-xl bg-[#0C121C] p-1">
          {tabButtons.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                data-state={isActive ? "active" : "inactive"}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-bold text-[#A9B2C7] transition ${tab.activeClass}`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === "GUILDS" ? (
          <GuildTable guilds={guilds} />
        ) : (
          <PlayerTable entries={activeEntries} metricHeader={TAB_META[activeTab].metricHeader} rowMetric={TAB_META[activeTab].rowMetric} />
        )}
      </section>
    </div>
  );
}
