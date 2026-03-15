import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/shared/page-shell";
import { RankingsShell } from "@/components/rankings/rankings-shell";
import { getGuildsPageData, getRankingsPageData } from "@/server/queries/appQueries";

export default async function RankingsPage() {
  const [rankings, guilds] = await Promise.all([getRankingsPageData(), getGuildsPageData()]);

  return (
    <PageShell>
      <section className="space-y-5 text-center">
        <Badge className="border-[#19E0FF]/24 bg-[#19E0FF]/10 text-[#19E0FF]">Ranking</Badge>
        <h1 className="text-5xl font-black leading-[0.92] tracking-tight text-white md:text-6xl">Rankings</h1>
        <p className="mx-auto max-w-3xl text-lg leading-8 text-[#A9B2C7]">Os melhores guerreiros de Nevareth.</p>
        <div className="mx-auto h-1 w-24 rounded-full bg-[#19E0FF]" />
      </section>

      <RankingsShell
        rankings={rankings}
        guilds={guilds.map((guild) => ({
          id: guild.id,
          slug: guild.slug,
          name: guild.name,
          faction: guild.faction,
          level: guild.level,
          memberCount: guild.memberCount,
        }))}
      />
    </PageShell>
  );
}
