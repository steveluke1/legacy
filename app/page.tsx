import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Download,
  ExternalLink,
  Flame,
  Gamepad2,
  Gift,
  MessageCircle,
  Shield,
  Skull,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Twitch,
  UserPlus,
  Users,
  Youtube,
} from "lucide-react";

import { PageShell } from "@/components/shared/page-shell";
import { Button } from "@/components/ui/button";
import { getHomePageData } from "@/server/queries/appQueries";

export const metadata: Metadata = {
  title: "Início",
  description:
    "Página inicial do portal Cabal Legacy com o visual clássico do servidor, destaques, rankings, guildas, loja premium e mercado ALZ.",
};

type LucideIcon = typeof Users;

type PrizeCardProps = {
  place: string;
  value: string;
  color: string;
};

type StatusMetricCardProps = {
  icon: LucideIcon;
  label: string;
  value: string | number;
  accent?: string;
};

type FeatureCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: string;
};

type SocialCardProps = {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  stat: string;
  accent: string;
};

const preRegistrationRewards = [
  "Título exclusivo de fundador",
  "Reserva antecipada de nickname",
  "Caixa comemorativa do portal",
  "Badge visual para a conta",
  "Cash inicial para acelerar a jornada",
  "Destaque de perfil na semana de lançamento",
  "Acesso rápido às rotas do portal",
  "Presente visual para o primeiro personagem",
];

const arrivalRewards = [
  { place: "Top 1 pré-registro", value: "Badge Neon", color: "#FFD700" },
  { place: "Top 2 pré-registro", value: "Caixa visual", color: "#C0C0C0" },
  { place: "Top 3 pré-registro", value: "Cash bônus", color: "#F2A65A" },
];

const featureCards = [
  {
    icon: Sparkles,
    title: "Combate, PvP e endgame",
    description:
      "Combates fluidos, batalhas ranqueadas e conteúdo pensado para quem quer competir de verdade.",
    accent: "#19E0FF",
  },
  {
    icon: Trophy,
    title: "DG com recompensa",
    description:
      "Dungeons com fluxo claro de progressão, premiações semanais e destaque para os melhores corredores.",
    accent: "#F7CE46",
  },
  {
    icon: Swords,
    title: "TG e PvP ranqueado",
    description:
      "Mata-mata, disputas de TG e ranking semanal com o mesmo clima visual do portal clássico.",
    accent: "#FF4B6A",
  },
  {
    icon: Shield,
    title: "Progressão moderna",
    description:
      "Ambiente estável, navegação local rápida e apresentação premium sem perder a identidade antiga.",
    accent: "#19E0FF",
  },
] satisfies FeatureCardProps[];

const communityCards = [
  {
    href: "https://discord.gg/caballegacy",
    icon: MessageCircle,
    title: "Discord",
    description: "Tire dúvidas, monte grupo para DG e acompanhe comunicados em tempo real.",
    stat: "5.000+ membros",
    accent: "#5865F2",
  },
  {
    href: "https://youtube.com/@caballegacy",
    icon: Youtube,
    title: "YouTube",
    description: "Tutoriais, builds, anúncios e conteúdos sobre as principais rotas do portal.",
    stat: "2.300+ inscritos",
    accent: "#FF0000",
  },
  {
    href: "https://twitch.tv/caballegacy",
    icon: Twitch,
    title: "Twitch",
    description: "Lives de guerra, dungeons e eventos especiais com o mesmo clima do legado.",
    stat: "1.100+ seguidores",
    accent: "#9146FF",
  },
] satisfies SocialCardProps[];

function StatusMetricCard({ icon: Icon, label, value, accent = "#19E0FF" }: StatusMetricCardProps) {
  return (
    <div className="rounded-[18px] border border-[#19E0FF]/10 bg-[#05070B]/82 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-[#19E0FF]/22">
      <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${accent}15` }}>
        <Icon className="h-5 w-5" style={{ color: accent }} />
      </div>
      <p className="text-3xl font-black text-white">{value}</p>
      <p className="mt-2 text-xs text-[#A9B2C7]">{label}</p>
    </div>
  );
}

function PrizeCard({ place, value, color }: PrizeCardProps) {
  return (
    <div className="portal-gold-glow rounded-xl border bg-[#0B111A] px-4 py-4 text-center" style={{ borderColor: `${color}40` }}>
      <p className="text-[11px] text-[#A9B2C7]">{place}</p>
      <p className="mt-2 text-3xl font-black" style={{ color }}>
        {value}
      </p>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, accent }: FeatureCardProps) {
  return (
    <div className="rounded-xl border border-[#19E0FF]/14 bg-[#0C121C] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)]">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl" style={{ backgroundColor: `${accent}18` }}>
        <Icon className="h-7 w-7" style={{ color: accent }} />
      </div>
      <h3 className="text-xl font-bold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[#A9B2C7]">{description}</p>
    </div>
  );
}

function SocialCard({ href, icon: Icon, title, description, stat, accent }: SocialCardProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group block rounded-xl border border-[#19E0FF]/16 bg-[#0C121C] p-6 transition-all duration-200 hover:-translate-y-1 hover:border-[#19E0FF]/28"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl" style={{ backgroundColor: `${accent}18` }}>
          <Icon className="h-7 w-7" style={{ color: accent }} />
        </div>
        <ExternalLink className="h-5 w-5 text-[#A9B2C7] transition-colors group-hover:text-white" />
      </div>
      <h3 className="text-xl font-bold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-[#A9B2C7]">{description}</p>
      <div className="mt-4 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
        <span className="text-sm font-medium" style={{ color: accent }}>
          {stat}
        </span>
      </div>
    </a>
  );
}

export default async function HomePage() {
  const { content, spotlightCharacters, featuredGuilds, featuredPlans } = await getHomePageData();
  const runners = spotlightCharacters.slice(0, 3);
  const onlinePlayers = spotlightCharacters.length ? spotlightCharacters.length * 46 : "-";
  const activeGuilds = featuredGuilds.length || "-";
  const spotlightPlan = featuredPlans.at(-1);

  return (
    <PageShell>
      <section className="relative -mx-4 overflow-hidden px-4 py-8 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 lg:py-10">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#04080E] via-[#08111B] to-[#04080E]" />
          <div className="absolute left-[-12%] top-[8%] h-[420px] w-[420px] rounded-full bg-[#19E0FF]/10 blur-[150px]" />
          <div className="absolute bottom-[-8%] right-[-10%] h-[460px] w-[460px] rounded-full bg-[#1A9FE8]/10 blur-[160px]" />
          <div className="absolute inset-y-0 left-[18%] w-px bg-gradient-to-b from-transparent via-[#19E0FF]/10 to-transparent" />
          <div className="absolute inset-y-0 right-[34%] w-px bg-gradient-to-b from-transparent via-[#19E0FF]/10 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-[1280px] space-y-16">
          <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-start">
            <div className="space-y-12">
              <div>
                <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#FFD700]/26 bg-[#FFD700]/10 px-7 py-3">
                  <Trophy className="h-5 w-5 text-[#FFD700]" />
                  <span className="text-sm font-bold uppercase tracking-[0.18em] text-[#FFD700]">Hall da Fama</span>
                </div>
                <h2 aria-label="Conquistas Históricas" className="text-5xl font-black tracking-tight text-white md:text-[3.85rem]">Conquistas Históricas</h2>
                <p className="mt-4 text-[1.05rem] text-[#A9B2C7]">Reconhecimento aos maiores guerreiros de Nevareth</p>
              </div>

              <div className="portal-glow-panel rounded-[22px] border border-[#19E0FF]/22 bg-[#04101B]/95 px-10 py-16 text-center shadow-[0_30px_90px_rgba(0,0,0,0.34)]">
                <Trophy className="mx-auto h-16 w-16 text-[#FFD700]/60" />
                <p className="mt-8 text-2xl font-medium text-[#D6DCE8]">Sem dados no momento</p>
                <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#7E8AA1]">
                  O Hall da Fama será exibido após as primeiras conquistas serem registradas.
                </p>
              </div>

              <div>
                <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#FF4B6A]/28 bg-[#FF4B6A]/10 px-7 py-3">
                  <Flame className="h-5 w-5 text-[#FF4B6A]" />
                  <span className="text-sm font-bold uppercase tracking-[0.18em] text-[#FF4B6A]">Corredor da Semana</span>
                </div>
                <h2 className="text-5xl font-black tracking-tight text-white md:text-[3.7rem]">Os Maiores Desbravadores</h2>
                <p className="mt-4 text-[1.05rem] text-[#A9B2C7]">Domine as dungeons e conquiste prêmios reais!</p>
                <div className="mt-4 flex items-center gap-2 text-sm text-[#A9B2C7]">
                  <Calendar className="h-4 w-4" />
                  <span>Período: Carregando...</span>
                </div>
              </div>

              <div className="portal-glow-panel rounded-[22px] border border-[#19E0FF]/16 bg-gradient-to-r from-[#FFD700]/10 to-[#19E0FF]/6 p-6 shadow-[0_26px_80px_rgba(0,0,0,0.3)]">
                <h3 className="flex items-center justify-center gap-2 text-xl font-bold text-white">
                  <Trophy className="h-6 w-6 text-[#FFD700]" /> Premiação Real
                </h3>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <PrizeCard place="1º Lugar" value="R$ 500,00" color="#FFD700" />
                  <PrizeCard place="2º Lugar" value="R$ 250,00" color="#C0C0C0" />
                  <PrizeCard place="3º Lugar" value="R$ 100,00" color="#F2A65A" />
                </div>
              </div>

              {runners.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {runners.map((entry) => (
                    <div
                      key={entry.characterId}
                      className="rounded-[20px] border border-[#19E0FF]/16 bg-[#04101B]/94 px-6 py-7 text-center shadow-[0_20px_50px_rgba(0,0,0,0.24)] transition-transform duration-200 hover:-translate-y-1"
                    >
                      <p className="text-4xl font-black text-[#19E0FF]">#{entry.position}</p>
                      <p className="mt-4 text-xl font-bold text-white">{entry.characterName}</p>
                      <p className="mt-2 text-sm font-semibold text-[#F7CE46]">{entry.guildName ?? "Sem guilda"}</p>
                      <div className="mt-6 rounded-xl border border-[#19E0FF]/10 bg-[#05070B]/78 px-4 py-4">
                        <p className="text-[11px] uppercase tracking-[0.16em] text-[#8D98AF]">Poder de combate</p>
                        <p className="mt-2 text-xl font-black text-white">{entry.battlePower.toLocaleString("pt-BR")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="portal-glow-panel rounded-[22px] border border-[#19E0FF]/16 bg-[#04101B]/94 px-8 py-14 text-center shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
                  <Target className="mx-auto h-16 w-16 text-[#19E0FF]/45" />
                  <p className="mt-8 text-2xl font-medium text-[#D6DCE8]">Ranking em breve</p>
                  <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#7E8AA1]">
                    Os próximos desbravadores aparecerão aqui assim que o ciclo semanal for consolidado.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-8 pt-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#19E0FF]/40 bg-[#19E0FF]/12 px-6 py-3 backdrop-blur-sm">
                <span className="portal-pulse-dot h-2.5 w-2.5 rounded-full bg-[#19E0FF] shadow-[0_0_18px_rgba(25,224,255,0.55)]" />
                <span className="text-sm font-bold uppercase tracking-[0.18em] text-[#19E0FF]">Servidor online</span>
              </div>

              <div>
                <h1 aria-label="Cabal Legacy" className="text-6xl font-black leading-[0.92] tracking-tight text-white md:text-[5.2rem]">
                  <span className="block">Cabal</span>
                  <span className="mt-2 block bg-gradient-to-r from-[#19E0FF] via-[#1A9FE8] to-[#19E0FF] bg-clip-text text-transparent">Legacy</span>
                </h1>
                <div className="mt-4 h-1 w-24 rounded-full bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8]" />
              </div>

              <p className="text-[2rem] leading-none text-[#A9B2C7] md:text-[2.1rem]">{content.heroTitle}</p>

              <div className="rounded-2xl border border-[#19E0FF]/16 bg-[#09111B]/84 p-6">
                <p className="text-base leading-8 text-[#A9B2C7]">{content.heroSubtitle}</p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="flex-1 gap-2 text-sm font-black">
                  <Link href="/entrar?modo=register">
                    Começar agora <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="flex-1 gap-2 text-sm">
                  <Link href="/rankings">
                    <Trophy className="h-4 w-4" /> Ver rankings
                  </Link>
                </Button>
              </div>

              <section className="portal-glow-panel overflow-hidden rounded-[22px] border border-[#19E0FF]/18 bg-[#04101B]/95 shadow-[0_30px_90px_rgba(0,0,0,0.34)]">
                <div className="flex items-center justify-between border-b border-[#19E0FF]/10 px-7 py-5">
                  <h2 className="flex items-center gap-2 text-[1.65rem] font-black text-white">
                    <Activity className="h-5 w-5 text-[#19E0FF]" /> Status do servidor
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="portal-pulse-dot h-2.5 w-2.5 rounded-full bg-[#19E0FF]" />
                    <span className="text-sm font-bold uppercase tracking-[0.16em] text-[#19E0FF]">Canal principal</span>
                  </div>
                </div>
                <div className="grid gap-4 p-6 sm:grid-cols-2">
                  <StatusMetricCard icon={Users} label="Jogadores online" value={onlinePlayers} accent="#19E0FF" />
                  <StatusMetricCard icon={Shield} label="Guildas ativas" value={activeGuilds} accent="#F7CE46" />
                  <StatusMetricCard icon={Swords} label="Batalhas de TG (24h)" value="-" accent="#FF4B6A" />
                </div>
                <div className="border-t border-[#19E0FF]/10 px-7 py-4 text-center text-xs text-[#A9B2C7]">
                  <span className="portal-pulse-dot mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#19E0FF]" /> Dados atualizados automaticamente
                </div>
              </section>

              <div className="pt-4">
                <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#FF4B6A]/28 bg-[#FF4B6A]/10 px-7 py-3">
                  <Skull className="h-5 w-5 text-[#FF4B6A]" />
                  <span className="text-sm font-bold uppercase tracking-[0.18em] text-[#FF4B6A]">Matador da Semana</span>
                </div>
                <h2 className="text-5xl font-black tracking-tight text-white md:text-[3.4rem]">Os Maiores Assassinos</h2>
                <p className="mt-4 text-[1.05rem] text-[#A9B2C7]">Mate mais na TG e conquiste prêmios em CASH!</p>
              </div>

              <div className="portal-glow-panel rounded-[22px] border border-[#19E0FF]/16 bg-gradient-to-r from-[#FFD700]/10 to-[#19E0FF]/6 p-6 shadow-[0_26px_80px_rgba(0,0,0,0.3)]">
                <h3 className="flex items-center justify-center gap-2 text-xl font-bold text-white">
                  <Trophy className="h-6 w-6 text-[#FFD700]" /> Premiação em CASH
                </h3>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <PrizeCard place="1º Lugar" value="500" color="#FFD700" />
                  <PrizeCard place="2º Lugar" value="250" color="#C0C0C0" />
                  <PrizeCard place="3º Lugar" value="100" color="#F2A65A" />
                </div>
              </div>

              <div className="portal-glow-panel rounded-[22px] border border-[#19E0FF]/16 bg-[#04101B]/94 px-8 py-14 text-center shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
                <Skull className="portal-float mx-auto h-16 w-16 text-[#FF4B6A]/45" />
                <p className="mt-8 text-2xl font-medium text-[#D6DCE8]">Ranking em breve</p>
                <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#7E8AA1]">
                  Os primeiros matadores aparecerão aqui assim que a TG semanal gerar dados suficientes.
                </p>
              </div>
            </div>
          </div>

          <section className="space-y-10 border-t border-[#19E0FF]/10 pt-4">
            <div className="mx-auto max-w-5xl rounded-[22px] border border-[#19E0FF]/16 bg-[#07101B]/94 p-8 shadow-[0_28px_90px_rgba(0,0,0,0.28)]">
              <p className="text-center text-sm font-bold uppercase tracking-[0.16em] text-white">Premiação total para o primeiro mês de lançamento</p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-[#F7CE46]/28 bg-[#0C121C] p-5 text-center">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[#A9B2C7]">Premiação acumulada</p>
                  <p className="mt-3 text-4xl font-black text-[#FFD700]">R$ 3.700,00</p>
                </div>
                <div className="rounded-xl border border-[#19E0FF]/24 bg-[#0C121C] p-5 text-center">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-[#A9B2C7]">Cash extra geral</p>
                  <p className="mt-3 text-4xl font-black text-[#19E0FF]">+70.000</p>
                </div>
              </div>
              <p className="mt-5 text-center text-sm text-[#8EA4C7]">Premiações semanais acumuladas durante o primeiro ciclo do servidor.</p>
            </div>

            <div className="grid gap-10 xl:grid-cols-[1.08fr_0.92fr]">
              <div className="rounded-[22px] border border-[#19E0FF]/18 bg-[#07101B]/94 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[#F7CE46]/30 bg-[#F7CE46]/10 px-5 py-2">
                    <Gift className="h-4 w-4 text-[#F7CE46]" />
                    <span className="text-sm font-bold text-[#F7CE46]">Pacote Pré-Lançamento</span>
                  </div>
                  <p className="mt-4 text-sm text-[#A9B2C7]">Pacote introdutório com brilho premium, caixa visual densa e CTA centralizado como no legado.</p>
                </div>

                <div className="mt-6 rounded-xl border border-[#F7CE46]/24 bg-gradient-to-br from-[#FFD700]/10 via-[#19E0FF]/6 to-transparent p-6">
                  <div className="flex h-40 items-center justify-center rounded-xl border border-[#F7CE46]/18 bg-[#0C121C]">
                    <Gift className="h-12 w-12 text-[#F7CE46]" />
                  </div>
                  <div className="mt-6 space-y-3 text-sm leading-7 text-[#A9B2C7]">
                    <p className="font-semibold text-white">{spotlightPlan?.name ?? "Pacote de lançamento do portal"}</p>
                    <ul className="space-y-2">
                      {(spotlightPlan?.perks ?? [
                        "Benefícios premium por 30 dias",
                        "Visual clássico do portal e acesso rápido às rotas principais",
                        "Oferta de entrada pensada para jogadores que querem começar forte",
                      ]).map((perk) => (
                        <li key={perk}>- {perk}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-6 flex flex-col items-center gap-3">
                    <div className="rounded-full border border-[#F7CE46]/24 bg-[#2A2110]/70 px-5 py-2 text-sm font-bold text-[#F7CE46]">
                      {spotlightPlan ? `Cash ${spotlightPlan.priceCash.toLocaleString("pt-BR")}` : "R$ 99,90"}
                    </div>
                    <Button asChild className="min-w-[220px]">
                      <Link href="/loja">Garantir pacote agora</Link>
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-10">
                <div className="rounded-[22px] border border-[#19E0FF]/18 bg-[#07101B]/94 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#19E0FF]/24 bg-[#19E0FF]/10 px-5 py-2">
                      <Gift className="h-4 w-4 text-[#19E0FF]" />
                      <span className="text-sm font-bold text-[#19E0FF]">Recompensas de Pré-Registro</span>
                    </div>
                    <p className="mt-4 text-sm text-[#A9B2C7]">Bônus desbloqueados para quem entra cedo no portal e garante presença no lançamento.</p>
                  </div>
                  <div className="mt-6 grid gap-3 md:grid-cols-2">
                    {preRegistrationRewards.map((reward) => (
                      <div key={reward} className="rounded-xl border border-[#19E0FF]/12 bg-[#08111B] px-4 py-3 text-sm text-[#A9B2C7]">
                        - {reward}
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex justify-center">
                    <Button asChild size="lg">
                      <Link href="/entrar?modo=register">Garantir minha recompensa</Link>
                    </Button>
                  </div>
                </div>

                <div className="rounded-[22px] border border-[#19E0FF]/18 bg-[#07101B]/94 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#F7CE46]/24 bg-[#F7CE46]/10 px-5 py-2">
                      <Trophy className="h-4 w-4 text-[#F7CE46]" />
                      <span className="text-sm font-bold text-[#F7CE46]">Recompensas por ordem de chegada</span>
                    </div>
                  </div>
                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    {arrivalRewards.map((reward) => (
                      <PrizeCard key={reward.place} place={reward.place} value={reward.value} color={reward.color} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mx-auto max-w-6xl space-y-10">
              <div className="text-center">
                <h2 className="text-4xl font-black text-white md:text-5xl">Por que Cabal Legacy?</h2>
                <p className="mt-4 text-lg text-[#A9B2C7]">Descubra o que torna nossa experiência única em Nevareth.</p>
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {featureCards.map((card) => (
                  <FeatureCard key={card.title} {...card} />
                ))}
              </div>
            </div>

            <section className="py-2">
              <div className="mx-auto max-w-6xl">
                <div className="flex flex-col items-center justify-center gap-6 text-center md:flex-row md:gap-12">
                  <div className="flex items-center gap-3"><CheckCircle2 className="h-6 w-6 text-[#19E0FF]" /><span className="text-lg font-semibold text-white">Economia justa</span></div>
                  <div className="flex items-center gap-3"><CheckCircle2 className="h-6 w-6 text-[#19E0FF]" /><span className="text-lg font-semibold text-white">PvP e GvG premiado</span></div>
                  <div className="flex items-center gap-3"><CheckCircle2 className="h-6 w-6 text-[#19E0FF]" /><span className="text-lg font-semibold text-white">Ranks com premiação</span></div>
                </div>
              </div>
            </section>

            <section className="py-8">
              <div className="mx-auto max-w-6xl">
                <div className="text-center">
                  <h2 className="text-4xl font-black text-white md:text-5xl">Como Funciona</h2>
                  <p className="mt-4 text-lg text-[#A9B2C7]">Três passos simples para começar sua jornada.</p>
                </div>
                <div className="relative mt-14">
                  <div className="absolute left-1/2 top-24 hidden h-0.5 w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#19E0FF]/30 to-transparent lg:block" />
                  <div className="grid gap-8 md:grid-cols-3 lg:gap-12">
                    <div className="relative text-center">
                      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#19E0FF] to-[#1A9FE8]"><UserPlus className="h-9 w-9 text-[#05070B]" /></div>
                      <div className="absolute left-1/2 top-[-8px] flex h-8 w-8 -translate-x-[-120%] items-center justify-center rounded-lg border-2 border-[#19E0FF] bg-[#05070B] text-xs font-bold text-[#19E0FF] md:left-[calc(50%+32px)] md:top-0">01</div>
                      <h3 className="text-2xl font-bold text-white">Criar Conta</h3>
                      <p className="mt-3 text-sm leading-7 text-[#A9B2C7]">Registre-se gratuitamente para acessar conta, rankings e compra de pacotes do portal.</p>
                    </div>
                    <div className="relative text-center">
                      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#19E0FF] to-[#1A9FE8]"><Download className="h-9 w-9 text-[#05070B]" /></div>
                      <div className="absolute left-1/2 top-[-8px] flex h-8 w-8 -translate-x-[-120%] items-center justify-center rounded-lg border-2 border-[#19E0FF] bg-[#05070B] text-xs font-bold text-[#19E0FF] md:left-[calc(50%+32px)] md:top-0">02</div>
                      <h3 className="text-2xl font-bold text-white">Baixar Cliente Cabal Legacy</h3>
                      <p className="mt-3 text-sm leading-7 text-[#A9B2C7]">Fluxo clássico do servidor, instalação rápida e acesso imediato à comunidade.</p>
                    </div>
                    <div className="relative text-center">
                      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#19E0FF] to-[#1A9FE8]"><Gamepad2 className="h-9 w-9 text-[#05070B]" /></div>
                      <div className="absolute left-1/2 top-[-8px] flex h-8 w-8 -translate-x-[-120%] items-center justify-center rounded-lg border-2 border-[#19E0FF] bg-[#05070B] text-xs font-bold text-[#19E0FF] md:left-[calc(50%+32px)] md:top-0">03</div>
                      <h3 className="text-2xl font-bold text-white">Entrar em Nevareth</h3>
                      <p className="mt-3 text-sm leading-7 text-[#A9B2C7]">Crie seu personagem, entre em uma guilda e dispute espaço nos rankings semanais.</p>
                    </div>
                  </div>
                </div>
                <div className="mt-12 text-center">
                  <Button asChild size="lg">
                    <Link href="/entrar?modo=register">Criar minha conta agora <ChevronRight className="h-4 w-4" /></Link>
                  </Button>
                </div>
              </div>
            </section>

            <section className="bg-[#0C121C]/50 px-6 py-16 sm:px-8 lg:px-10">
              <div className="mx-auto max-w-6xl">
                <div className="text-center">
                  <h2 className="text-4xl font-black text-white md:text-5xl">Comunidade Cabal Legacy</h2>
                  <p className="mt-4 text-lg text-[#A9B2C7]">Conecte-se com milhares de jogadores apaixonados por CABAL.</p>
                </div>
                <div className="mt-10 grid gap-6 md:grid-cols-3">
                  {communityCards.map((card) => (
                    <SocialCard key={card.title} {...card} />
                  ))}
                </div>
              </div>
            </section>

            <section className="relative overflow-hidden rounded-[26px] px-4 py-24 sm:px-6 lg:px-8">
              <div className="absolute inset-0 bg-gradient-to-b from-[#05070B] via-[#0C121C] to-[#05070B]" />
              <div className="portal-pulse-dot absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#19E0FF]/10 blur-[200px]" />
              <div className="relative z-10 mx-auto max-w-4xl text-center">
                <h2 className="text-4xl font-black text-white md:text-5xl lg:text-6xl">Pronto para voltar a <span className="bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] bg-clip-text text-transparent">Nevareth</span>?</h2>
                <p className="mx-auto mt-6 max-w-2xl text-xl text-[#A9B2C7]">Milhares de jogadores já estão conquistando os rankings. Sua jornada épica em Cabal Legacy começa agora.</p>
                <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
                  <Button asChild size="lg"><Link href="/entrar?modo=register">Criar minha conta <ChevronRight className="h-4 w-4" /></Link></Button>
                  <Button asChild variant="outline" size="lg"><Link href="/guildas"><Users className="h-4 w-4" /> Ver guildas e ranking</Link></Button>
                </div>
              </div>
            </section>
          </section>
        </div>
      </section>
    </PageShell>
  );
}
