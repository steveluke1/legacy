import { requireUserSession } from "@/server/auth/guards";
import { ShopService } from "@/server/services/shop/shopService";
import { PageShell } from "@/components/shared/page-shell";
import { ShopLegacyView } from "@/components/shop/shop-legacy-view";

const shopService = new ShopService();

export default async function ShopPage() {
  const session = await requireUserSession();
  const snapshot = await shopService.getShopSnapshot(session.user!.id);

  return (
    <PageShell>
      <ShopLegacyView
        premiumPlans={snapshot.premiumPlans}
        catalog={snapshot.catalog}
        walletCash={snapshot.wallet?.cashBalance ?? 0}
        premiumTier={snapshot.wallet?.premiumTier ?? "none"}
      />
    </PageShell>
  );
}
