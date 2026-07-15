export const dynamic = "force-dynamic";

type WalletPayload = {
  wallet?: {
    available_cents?: number;
    cashback_cents?: number;
    store_credit_cents?: number;
    gift_card_cents?: number;
  };
};

async function load(): Promise<WalletPayload> {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL || "";
    const res = await fetch(`${base}/api/financial-platform/wallet`, { cache: "no-store" });
    if (!res.ok) return {};
    return (await res.json()) as WalletPayload;
  } catch {
    return {};
  }
}

function brl(cents: number | undefined): string {
  return ((cents ?? 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** BP 5.2 — linguagem humana; deixa claro que isto não é o checkout. */
export default async function CompradorFinanceiroPage() {
  const data = await load();
  const w = data.wallet ?? {};

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Saldos da conta</h1>
      <p className="mt-2 text-body text-muted-foreground">
        Valores abaixo, quando existirem, são créditos na plataforma. O pagamento de pedidos de cartas
        continua sendo feito no checkout (PIX ou cartão), não por estes saldos — até que isso seja
        ligado de forma explícita no fluxo de compra.
      </p>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border p-4">
          <p className="text-small text-muted-foreground">Disponível</p>
          <p className="text-xl font-medium tabular-nums">{brl(w.available_cents)}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-small text-muted-foreground">Cashback acumulado</p>
          <p className="text-xl font-medium tabular-nums">{brl(w.cashback_cents)}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-small text-muted-foreground">Crédito em lojas</p>
          <p className="text-xl font-medium tabular-nums">{brl(w.store_credit_cents)}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-small text-muted-foreground">Cartões-presente</p>
          <p className="text-xl font-medium tabular-nums">{brl(w.gift_card_cents)}</p>
        </div>
      </section>
    </main>
  );
}
