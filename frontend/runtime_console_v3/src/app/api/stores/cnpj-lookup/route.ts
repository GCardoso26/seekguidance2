import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function isValidCnpj(value: string): boolean {
  const d = onlyDigits(value);
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;

  const check = (base: string, weights: number[]) => {
    const total = base.split("").reduce((acc, n, i) => acc + Number(n) * weights[i]!, 0);
    const rest = total % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = check(d.slice(0, 12), w1);
  const d2 = check(d.slice(0, 12) + String(d1), w2);
  return d.slice(12) === `${d1}${d2}`;
}

function formatCnpj(digits: string): string {
  const d = onlyDigits(digits);
  if (d.length !== 14) return d;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/** Lookup cadastral (somente leitura). Nunca auto-aprova credenciamento. */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("cnpj") ?? "";
  if (!isValidCnpj(raw)) {
    return NextResponse.json({ detail: "CNPJ inválido" }, { status: 400 });
  }
  const digits = onlyDigits(raw);

  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    if (res.status === 404) {
      return NextResponse.json({ detail: "CNPJ não encontrado" }, { status: 404 });
    }
    if (!res.ok) {
      return NextResponse.json(
        { detail: "Consulta CNPJ temporariamente indisponível. Tente novamente." },
        { status: 502 },
      );
    }
    const data = (await res.json()) as Record<string, unknown>;
    return NextResponse.json({
      cnpj: formatCnpj(digits),
      razao_social: data.razao_social ?? data.nome ?? null,
      nome_fantasia: data.nome_fantasia ?? null,
      descricao_situacao_cadastral: data.descricao_situacao_cadastral ?? null,
      situacao_cadastral: data.situacao_cadastral ?? null,
      logradouro: data.logradouro ?? null,
      numero: data.numero ?? null,
      bairro: data.bairro ?? null,
      municipio: data.municipio ?? null,
      uf: data.uf ?? null,
      cep: data.cep ?? null,
      cnae_fiscal_descricao: data.cnae_fiscal_descricao ?? null,
      confirmation_required: true,
      auto_approved: false,
    });
  } catch {
    return NextResponse.json(
      { detail: "Falha ao consultar CNPJ. Tente novamente em instantes." },
      { status: 503 },
    );
  }
}
