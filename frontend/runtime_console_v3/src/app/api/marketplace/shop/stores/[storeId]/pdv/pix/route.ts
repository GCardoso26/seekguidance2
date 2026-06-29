import { NextRequest, NextResponse } from "next/server";
import { TOURNAMENT_API_BASE, tournamentProxyHeaders } from "@/lib/tournament-api";

function formatBrl(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function buildManualPixPayload(
  store: Record<string, unknown>,
  amountCents: number,
  items: unknown[],
): Record<string, unknown> {
  const storeName = String(store.name ?? "Loja");
  const pixKey = String(store.pix_key ?? "");
  const txid = `pdv-manual-${Date.now().toString(36)}`;
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const copyPayload = pixKey
    ? `Pagamento PIX — ${storeName}\nChave: ${pixKey}\nValor: ${formatBrl(amountCents)}\nIdentificador: ${txid}`
    : `Configure sua chave PIX em Configurações.\nValor: ${formatBrl(amountCents)}\nIdentificador: ${txid}`;

  return {
    mode: "manual",
    transaction_id: txid,
    txid,
    sale_id: null,
    copy_payload: copyPayload,
    qr_code: null,
    pix_qr_code: null,
    amount_cents: amountCents,
    pix_key: pixKey,
    store_name: storeName,
    expires_at: expiresAt,
    items,
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ storeId: string }> },
) {
  try {
    const { storeId } = await params;
    const body = (await req.json()) as {
      amount_cents?: number;
      items?: Array<Record<string, unknown>>;
    };
    const items = body.items ?? [];
    const amountFromItems = items.reduce(
      (sum, item) => sum + Number(item.price_cents ?? 0) * Number(item.quantity ?? 1),
      0,
    );
    const amountCents = Math.max(0, Number(body.amount_cents ?? amountFromItems));

    if (amountCents <= 0 || items.length === 0) {
      return NextResponse.json({ detail: "Carrinho inválido" }, { status: 400 });
    }

    const upstream = `${TOURNAMENT_API_BASE}/runtime/judge/marketplace/shop/stores/${encodeURIComponent(storeId)}/pdv/pix`;
    try {
      const res = await fetch(upstream, {
        method: "POST",
        headers: {
          ...(await tournamentProxyHeaders()),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items }),
        cache: "no-store",
      });
      if (res.ok) {
        const text = await res.text();
        return new NextResponse(text, { status: res.status, headers: { "Content-Type": "application/json" } });
      }
    } catch {
      /* fallback manual */
    }

    const dashRes = await fetch(`${TOURNAMENT_API_BASE}/runtime/judge/seller/dashboard`, {
      headers: await tournamentProxyHeaders(),
      cache: "no-store",
    });
    if (!dashRes.ok) {
      return NextResponse.json({ detail: "Loja indisponível" }, { status: 503 });
    }
    const dash = (await dashRes.json()) as { store?: Record<string, unknown> };
    const store = dash.store ?? {};
    return NextResponse.json(buildManualPixPayload(store, amountCents, items));
  } catch {
    return NextResponse.json({ detail: "API indisponível" }, { status: 503 });
  }
}
