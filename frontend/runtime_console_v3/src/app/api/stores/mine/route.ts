import { NextResponse } from "next/server";
import { fetchApiResilient, tournamentProxyHeaders } from "@/lib/tournament-api";
import { useSellerCiMocks } from "@/lib/seller-ci-mock";

export const maxDuration = 60;

const E2E_STORE = [
  {
    id: "e2e-store-1",
    slug: "e2e-test-store",
    name: "E2E Test Store",
    owner_id: "e2e-seller",
  },
];

export async function GET() {
  if (useSellerCiMocks()) {
    return NextResponse.json(E2E_STORE);
  }
  try {
    const res = await fetchApiResilient(`/runtime/judge/stores/mine`, {
      headers: await tournamentProxyHeaders(),
      cache: "no-store",
    });
    const text = await res.text();
    return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json(
      {
        detail:
          "API indisponível — o servidor Render pode estar acordando. Aguarde 1 minuto e tente novamente.",
      },
      { status: 503 },
    );
  }
}
