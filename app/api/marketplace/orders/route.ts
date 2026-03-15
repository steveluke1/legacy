import { UserAuthService } from "@/server/services/auth/userAuthService";
import { MarketplaceService } from "@/server/services/marketplace/marketplaceService";
import { createOrderSchema } from "@/lib/schemas/marketplace";
import { jsonOk, parseJsonBody, toErrorResponse, unauthorized } from "@/app/api/_lib/http";

const authService = new UserAuthService();
const marketplaceService = new MarketplaceService();

export async function GET() {
  const session = await authService.getCurrentSession();
  if (!session?.user) {
    return unauthorized();
  }

  const snapshot = await marketplaceService.getSnapshot(session.user.id);
  return jsonOk({ orders: snapshot.orders });
}

export async function POST(request: Request) {
  try {
    const session = await authService.getCurrentSession();
    if (!session?.user) {
      return unauthorized();
    }

    const payload = await parseJsonBody(request, createOrderSchema);
    const order = await marketplaceService.purchaseListing(session.user.id, payload.listingId, payload.buyerCharacterId);
    return jsonOk({ order });
  } catch (error) {
    return toErrorResponse(error, "Falha ao comprar lote de ALZ.");
  }
}