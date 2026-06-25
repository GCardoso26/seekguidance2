import { NextRequest, NextResponse } from "next/server";
import { calculateValuation } from "@/lib/pricing/valuation-engine";
import { TOURNAMENT_API_BASE } from "@/lib/tournament-api";

export async function GET(req: NextRequest) {
  const cardId = req.nextUrl.searchParams.get("card_id");
  const condition = req.nextUrl.searchParams.get("condition") ?? "NM";

  if (cardId?.trim()) {
    try {
      const res = await fetch(
        `${TOURNAMENT_API_BASE}/runtime/judge/catalog/cards/${encodeURIComponent(cardId.trim())}/valuation?condition=${encodeURIComponent(condition)}`,
        { next: { revalidate: 3600 } },
      );
      if (res.ok) {
        return NextResponse.json(await res.json());
      }
    } catch {
      /* fallback para valuation por nome */
    }
  }

  const cardName = req.nextUrl.searchParams.get("name");
  const game = req.nextUrl.searchParams.get("game") ?? "mtg";

  if (!cardName?.trim()) {
    return NextResponse.json({ error: "Parâmetro name ou card_id é obrigatório" }, { status: 400 });
  }

  const valuation = await calculateValuation(cardName.trim(), condition, game);
  return NextResponse.json(valuation);
}
