"use client";

import Link from "next/link";
import { Crown, Gem, Shield, Star, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { PremiumPlanRecord } from "@/lib/types/product";
import { formatCurrency } from "@/lib/formatters";
import { useAppUi } from "@/components/providers/app-providers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const TIER_META = {
  bronze: { icon: Star, color: "#CD7F32", badge: "Bronze Crystal" },
  silver: { icon: Zap, color: "#E5E4E2", badge: "Platinum Crystal" },
  gold: { icon: Crown, color: "#FFD700", badge: "Legendary Arch-Crystal" },
} as const;

export function PremiumPurchaseGrid({ plans }: { plans: PremiumPlanRecord[] }) {
  const router = useRouter();
  const { pushToast } = useAppUi();
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);

  async function purchase(planId: string) {
    setPendingPlanId(planId);

    try {
      const response = await fetch("/api/shop/premium/purchase", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ planId }),
      });

      const data = (await response.json()) as { success: boolean; error?: string };
      if (!response.ok || !data.success) {
        pushToast(data.error ?? "Falha ao ativar o plano premium.", "error");
        return;
      }

      pushToast("Plano ativado com sucesso.", "success");
      router.refresh();
    } finally {
      setPendingPlanId(null);
    }
  }

  if (plans.length === 0) {
    return <div className="portal-empty">Nenhum plano premium está disponível no momento.</div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {plans.map((plan, index) => {
        const meta = TIER_META[plan.tier];
        const Icon = meta.icon;
        const isPending = pendingPlanId === plan.id;
        const isFeatured = plan.tier === "silver";

        return (
          <article
            key={plan.id}
            className={`relative overflow-hidden rounded-[22px] border bg-[#0C121C] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.24)] ${
              isFeatured ? "border-[#19E0FF]/45 shadow-[0_24px_60px_rgba(25,224,255,0.18)]" : "border-[#19E0FF]/16"
            } ${isFeatured ? "lg:scale-[1.03] lg:-mt-3" : ""}`}
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#19E0FF] to-transparent opacity-70" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: `${meta.color}18` }}>
                  <Icon className="h-10 w-10" style={{ color: meta.color }} />
                </div>
                <h3 className="text-3xl font-bold text-white">{plan.name}</h3>
                <p className="mt-2 text-sm text-[#A9B2C7]">Premium por {plan.durationDays} dias</p>
              </div>
              <Badge className="border-[#19E0FF]/18 bg-[#0E1722] text-[#19E0FF]">{meta.badge}</Badge>
            </div>

            <div className="mt-6 rounded-2xl border border-[#19E0FF]/10 bg-[#08111B] px-5 py-5 text-center">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[#8EA4C7]">Ativação local</p>
              <p className="mt-3 text-5xl font-black text-white">{formatCurrency(plan.priceCash, "cash")}</p>
            </div>

            <div className="mt-6 space-y-3">
              {plan.perks.map((perk) => (
                <div key={perk} className="flex items-start gap-3 rounded-xl border border-[#19E0FF]/10 bg-[#08111B] px-4 py-3">
                  <Shield className="mt-0.5 h-4 w-4 text-[#19E0FF]" />
                  <span className="text-sm leading-6 text-[#A9B2C7]">{perk}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-3">
              <Button type="button" className="w-full" disabled={pendingPlanId !== null} onClick={() => void purchase(plan.id)}>
                {isPending ? "Processando..." : "Ativar plano"}
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href={`/suporte?assunto=compra-cash-brl&plano=${plan.id}`}>
                  <Gem className="mr-2 h-4 w-4" /> Comprar com CASH BRL
                </Link>
              </Button>
            </div>

            {index === 1 ? <p className="mt-5 text-center text-xs uppercase tracking-[0.16em] text-[#19E0FF]">Mais vantajoso</p> : null}
          </article>
        );
      })}
    </div>
  );
}
