import { NextRequest, NextResponse } from "next/server";

type BrasilApiCep = {
  cep?: string;
  state?: string;
  city?: string;
  neighborhood?: string;
  street?: string;
  location?: {
    type?: string;
    coordinates?: { longitude?: string | number; latitude?: string | number };
  };
};

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ cep: string }> },
) {
  const { cep } = await ctx.params;
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) {
    return NextResponse.json({ detail: "CEP inválido" }, { status: 400 });
  }
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${digits}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) {
      return NextResponse.json({ detail: "CEP não encontrado" }, { status: res.status });
    }
    const data = (await res.json()) as BrasilApiCep;
    const coords = data.location?.coordinates;
    const lat = coords?.latitude != null ? Number(coords.latitude) : null;
    const lng = coords?.longitude != null ? Number(coords.longitude) : null;
    return NextResponse.json({
      cep: digits,
      city: data.city ?? null,
      state: data.state ?? null,
      neighborhood: data.neighborhood ?? null,
      street: data.street ?? null,
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null,
    });
  } catch {
    return NextResponse.json({ detail: "Falha ao consultar CEP" }, { status: 503 });
  }
}
