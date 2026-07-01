import { NextRequest } from "next/server";
import { GET as catalogCardSearch } from "@/app/api/catalog/cards/search/route";

/**
 * Alias BFF Epic 22 — busca de cartas no marketplace/catálogo.
 * Delega para /api/catalog/cards/search (mesma lógica, rate limit e cache).
 */
export async function GET(request: NextRequest) {
  return catalogCardSearch(request);
}
