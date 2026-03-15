"use client";

import Link from "next/link";
import { Check, Crown, Gift, Shield, Star, Zap } from "lucide-react";
import { useMemo, useState } from "react";

import type { PremiumPlanRecord, ShopProductRecord } from "@/lib/types/product";
import { formatCurrency } from "@/lib/formatters";
import { useAppUi } from "@/components/providers/app-providers";
import { PremiumPurchaseGrid } from "@/components/shop/premium-purchase-form";
import { Button } from "@/components/ui/button";

type ActiveTab = "loja" | "premium";

const COMPARISON_SECTIONS = [
  {
    title: "Bonus de Progressao",
    rows: [
      { label: "Bonus EXP", values: ["1000%", "2500%", "5000%"] },
      { label: "Aumento de Taxa de Drop", values: ["15%", "35%", "70%"] },
      { label: "Bonus WEXP", values: ["25%", "50%", "100%"] },
      { label: "Bonus de Pet EXP", values: ["100%", "250%", "500%"] },
      { label: "AXP Bonus", values: ["75%", "150%", "300%"] },
    ],
  },
  {
    title: "Capacidade e Slots",
    rows: [
      { label: "Expandir Inventario", values: ["2 itens", "3 itens", "4 itens"] },
      { label: "Expandir Armazem Pessoal", values: ["1 item", "1 item", "1 item"] },
      { label: "Bonus Slot Loja Agente", values: ["4 itens", "8 itens", "12 itens"] },
      { label: "Aumentar registro no mercado", values: ["25", "40", "65"] },
    ],
  },
  {
    title: "Dungeons e Recompensas",
    rows: [
      { label: "Taxa drop de caixa", values: ["10%", "25%", "50%"] },
      { label: "Recompensa exclusiva Premium", values: ["Sim", "Sim", "Sim"] },
      { label: "Tempo de dungeon aumentado", values: ["+20%", "+50%", "+100%"] },
    ],
  },
  {
    title: "Beneficios Especiais",
    rows: [
      { label: "Sorteio mensal", values: ["Nao", "Nao", "Sim"] },
      { label: "Desconto na loja", values: ["Nao", "5%", "10%"] },
      { label: "Destaque no ranking", values: ["Nao", "Sim", "Sim"] },
    ],
  },
];

function tierLabel(tier: "none" | "bronze" | "silver" | "gold") {
  if (tier === "gold") return "Ouro";
  if (tier === "silver") return "Prata";
  if (tier === "bronze") return "Bronze";
  return "Nenhum";
}

function planOrder(plan: PremiumPlanRecord) {
  if (plan.tier === "bronze") return 1;
  if (plan.tier === "silver") return 2;
  return 3;
}

export function ShopLegacyView({
  premiumPlans,
  catalog,
  walletCash,
  premiumTier,
}: {
  premiumPlans: PremiumPlanRecord[];
  catalog: ShopProductRecord[];
  walletCash: number;
  premiumTier: "none" | "bronze" | "silver" | "gold";
}) {
  const { pushToast } = useAppUi();
  const [activeTab, setActiveTab] = useState<ActiveTab>("premium");
  const sortedPlans = useMemo(() => [...premiumPlans].sort((a, b) => planOrder(a) - planOrder(b)), [premiumPlans]);

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-black text-white">Loja do Portal</h1>
        <div className="h-1 w-20 rounded-full bg-[#19E0FF]" />
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="portal-subpanel px-5 py-5 text-center">
          <p className="portal-metric">Saldo em caixa</p>
          <p className="portal-metric-value">{formatCurrency(walletCash, "cash")}</p>
        </article>
        <article className="portal-subpanel px-5 py-5 text-center">
          <p className="portal-metric">Tier atual</p>
          <p className="portal-metric-value">{tierLabel(premiumTier)}</p>
        </article>
        <article className="portal-subpanel px-5 py-5 text-center">
          <p className="portal-metric">Planos ativos</p>
          <p className="portal-metric-value">{sortedPlans.length}</p>
        </article>
      </section>

      <section className="portal-panel p-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("loja")}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
              activeTab === "loja"
                ? "bg-gradient-to-r from-[#19E0FF] to-[#1A9FE8] text-[#05070B]"
                : "bg-[#0C121C] text-[#A9B2C7] hover:text-white"
            }`}
          >
            Loja
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("premium")}
            className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
              activeTab === "premium"
                ? "bg-gradient-to-r from-[#F7CE46] to-[#FFD700] text-[#111315]"
                : "bg-[#0C121C] text-[#A9B2C7] hover:text-white"
            }`}
          >
            Premium & VIP
          </button>
        </div>
      </section>

      {activeTab === "premium" ? (
        <div className="space-y-8">
          <section className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#FFD700]/30 bg-[#FFD700]/10 px-4 py-2">
              <Crown className="h-4 w-4 text-[#FFD700]" />
              <span className="text-xs font-bold tracking-[0.14em] text-[#FFD700]">PLANOS EXCLUSIVOS PREMIUM</span>
            </div>
            <h2 className="mt-4 text-4xl font-black text-white md:text-5xl">Desbloqueie Seu Poder em Nevareth</h2>
            <p className="mx-auto mt-3 max-w-3xl text-base text-[#A9B2C7]">
              Ative sua progressao, domine dungeons e conquiste TG com beneficios Premium.
            </p>
            <p className="mt-3 text-sm font-semibold text-[#19E0FF]">Chega de jogar em desvantagem. Ative seu Premium agora.</p>
            <h3 className="sr-only">Planos premium e utilitários</h3>
          </section>

          <PremiumPurchaseGrid plans={sortedPlans} />

          <section className="portal-panel overflow-hidden p-6">
            <h3 className="text-center text-3xl font-black text-white">Comparacao Detalhada de Beneficios</h3>

            <div className="mt-6 space-y-6">
              {COMPARISON_SECTIONS.map((section) => (
                <div key={section.title} className="space-y-2">
                  <div className="rounded-lg bg-gradient-to-r from-[#19E0FF]/20 to-transparent px-4 py-3">
                    <h4 className="text-lg font-bold text-[#19E0FF]">{section.title}</h4>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[700px]">
                      <thead>
                        <tr className="border-b border-[#19E0FF]/20">
                          <th className="px-4 py-3 text-left text-sm font-medium text-[#A9B2C7]">Beneficio</th>
                          <th className="px-4 py-3 text-center text-sm font-bold text-[#CD7F32]">Premium 1</th>
                          <th className="px-4 py-3 text-center text-sm font-bold text-[#E5E4E2]">Premium 2</th>
                          <th className="px-4 py-3 text-center text-sm font-bold text-[#FFD700]">Premium 3</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.rows.map((row) => (
                          <tr key={row.label} className="border-b border-[#19E0FF]/10">
                            <td className="px-4 py-3 text-sm text-white">{row.label}</td>
                            {row.values.map((value, index) => (
                              <td key={`${row.label}_${index}`} className="px-4 py-3 text-center text-sm text-[#A9B2C7]">
                                {value === "Sim" ? (
                                  <span className="inline-flex items-center gap-1 text-[#19E0FF]">
                                    <Check className="h-4 w-4" /> Sim
                                  </span>
                                ) : (
                                  value
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="space-y-6">
          <section className="portal-panel overflow-hidden p-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white">Gift Cards</h2>
              <p className="text-sm text-[#A9B2C7]">Catalogo local de utilitarios e recompensas especiais.</p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {catalog.map((item) => (
                <article key={item.id} className="portal-subpanel p-5">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#19E0FF]/14">
                    <Gift className="h-5 w-5 text-[#19E0FF]" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{item.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#A9B2C7]">{item.description}</p>
                  <p className="mt-4 text-2xl font-black text-[#19E0FF]">{formatCurrency(item.priceCash, "cash")}</p>
                  <Button type="button" className="mt-5 w-full" onClick={() => pushToast("Compra deste item sera liberada no proximo ciclo.", "info")}>
                    Comprar
                  </Button>
                </article>
              ))}
            </div>
          </section>

          <section className="portal-panel p-6">
            <h3 className="text-xl font-bold text-white">Beneficios do Premium</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <article className="portal-subpanel p-4">
                <Star className="h-5 w-5 text-[#FFD700]" />
                <p className="mt-2 text-sm text-[#A9B2C7]">Progressao acelerada e bonus em atividades.</p>
              </article>
              <article className="portal-subpanel p-4">
                <Shield className="h-5 w-5 text-[#19E0FF]" />
                <p className="mt-2 text-sm text-[#A9B2C7]">Conta reforcada com perks de conveniencia.</p>
              </article>
              <article className="portal-subpanel p-4">
                <Zap className="h-5 w-5 text-[#FF4B6A]" />
                <p className="mt-2 text-sm text-[#A9B2C7]">Mais competitividade no ciclo semanal do servidor.</p>
              </article>
            </div>
            <div className="mt-4">
              <Button type="button" variant="outline" onClick={() => setActiveTab("premium")}>
                Ver planos Premium & VIP
              </Button>
            </div>
          </section>
        </div>
      )}

      <section className="portal-panel border-[#19E0FF]/20 px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#A9B2C7]">Para compras em BRL e suporte de pagamento, abra atendimento no painel de suporte.</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/suporte?assunto=compra-loja">Abrir suporte</Link>
          </Button>
        </div>
      </section>
    </section>
  );
}
