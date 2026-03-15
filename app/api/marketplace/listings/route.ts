import { UserAuthService } from "@/server/services/auth/userAuthService";
import { MarketplaceService } from "@/server/services/marketplace/marketplaceService";
import { createListingSchema } from "@/lib/schemas/marketplace";
import { jsonOk, parseJsonBody, toErrorResponse, unauthorized } from "@/app/api/_lib/http";

const authService = new UserAuthService();
const marketplaceService = new MarketplaceService();

export async function GET() {
  const snapshot = await marketplaceService.getSnapshot();
  return jsonOk({ listings: snapshot.listings, settings: snapshot.settings });
}

export async function POST(request: Request) {
  try {
    const session = await authService.getCurrentSession();
    if (!session?.user) {
      return unauthorized();
    }

    const payload = await parseJsonBody(request, createListingSchema);
    const listing = await marketplaceService.createListing(session.user.id, payload);
    return jsonOk({ listing });
  } catch (error) {
    return toErrorResponse(error, "Falha ao anunciar lote.");
  }
}