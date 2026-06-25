import { NextRequest, NextResponse } from "next/server";
import { calculateValuation } from "@/lib/pricing/valuation-engine";

export async function GET(req: NextRequest) {
  const cardName = req.nextUrl.searchParams.get("name");
  const condition = req.nextUrl.searchParams.get("condition") ?? "NM";
  const game = req.nextUrl.searchParams.get("game") ?? "mtg";

  if (!cardName?.trim()) {
    return NextResponse.json({ error: "Parâmetro name é obrigatório" }, { status: 400 });
  }

  const valuation = await calculateValuation(cardName.trim(), condition, game);
  return NextResponse.json(valuation);
}
