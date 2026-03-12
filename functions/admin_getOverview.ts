
import { handleAdminOverview } from "./_shared/adminOverviewHandler.js";

Deno.serve((req) => handleAdminOverview(req));
