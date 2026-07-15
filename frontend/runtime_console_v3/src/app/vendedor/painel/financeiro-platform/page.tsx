export const dynamic = "force-dynamic";

type Dash = {
  seller?: {
    pending?: { payouts?: number };
    payouts?: unknown[];
    escrow?: { cases?: unknown[] };
  };
  marketplace?: { financial_health?: { health_score?: number } };
};

async function load(): Promise<Dash> {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL || "";
    const res = await fetch(`${base}/api/financial-platform/dashboard`, { cache: "no-store" });
    if (!res.ok) return {};
    return (await res.json()) as Dash;
  } catch {
    return {};
  }
}

export default async function SellerFinanceiroPlatformPage() {
  const data = await load();

  return (
    <main className="mx-auto max-w-4xl p-6">
      <p className="text-sm uppercase tracking-wide text-muted-foreground">Financial Platform</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">Financeiro (platform)</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Paralelo ao painel PIX existente — escrow, repasses e saúde financeira via marts.
      </p>

      <section className="mt-8 space-y-4 text-sm">
        <p>
          Health score:{" "}
          <strong>{data.marketplace?.financial_health?.health_score ?? "—"}</strong>
        </p>
        <p>Payouts pendentes: {data.seller?.pending?.payouts ?? 0}</p>
        <p>Escrow cases: {data.seller?.escrow?.cases?.length ?? 0}</p>
      </section>
    </main>
  );
}
