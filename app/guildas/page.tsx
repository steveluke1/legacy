import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/shared/page-shell";
import { GuildsShell } from "@/components/guilds/guilds-shell";
import { getGuildsPageData } from "@/server/queries/appQueries";

export default async function GuildsPage() {
  const guilds = await getGuildsPageData();

  return (
    <PageShell>
      <section className="space-y-5">
        <Badge className="border-[#19E0FF]/24 bg-[#19E0FF]/10 text-[#19E0FF]">Guildas</Badge>
        <h1 className="text-5xl font-black leading-[0.92] tracking-tight text-white md:text-6xl">Alianças ativas do Cabal Legacy</h1>
        <p className="max-w-3xl text-lg leading-8 text-[#A9B2C7]">
          Veja facção, nível, status de recrutamento e os principais nomes de cada guilda em um layout inspirado no portal clássico.
        </p>
      </section>

      <GuildsShell guilds={guilds} />
    </PageShell>
  );
}
