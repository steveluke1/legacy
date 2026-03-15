import { jsonOk } from "@/app/api/_lib/http";

export async function GET() {
  return jsonOk({ status: "ok", runtime: "next-app-router", app: "cabal-legacy" });
}