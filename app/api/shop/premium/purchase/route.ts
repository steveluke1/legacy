import { UserAuthService } from "@/server/services/auth/userAuthService";
import { ShopService } from "@/server/services/shop/shopService";
import { purchasePremiumSchema } from "@/lib/schemas/product";
import { jsonOk, parseJsonBody, toErrorResponse, unauthorized } from "@/app/api/_lib/http";

const authService = new UserAuthService();
const shopService = new ShopService();

export async function POST(request: Request) {
  try {
    const session = await authService.getCurrentSession();
    if (!session?.user) {
      return unauthorized();
    }

    const payload = await parseJsonBody(request, purchasePremiumSchema);
    const order = await shopService.purchasePremium(session.user.id, payload.planId);
    return jsonOk({ order });
  } catch (error) {
    return toErrorResponse(error, "Falha ao comprar premium.");
  }
}