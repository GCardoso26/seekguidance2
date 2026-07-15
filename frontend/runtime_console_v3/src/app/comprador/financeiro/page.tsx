export const dynamic = "force-dynamic";

type WalletPayload = {
  wallet?: {
    available_cents?: number;
    cashback_cents?: number;
    store_credit_cents?: number;
    gift_card_cents?: number;
    checkout_wired?: boolean;
  };
};

async function loadWallet(): Promise<WalletPayload> {
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL || "";
    const res = await fetch(`${base}/api/financial-platform/wallet`, { cache: "no-store" });
    if (!res.ok) return {};
    return (await res.json()) as WalletPayload;
  } catch {
    return {};
  }
}

export default async function CompradorFinanceiroPage() {
  const data = await loadWallet();
  const w = data.wallet ?? {};

  return (
    <main className="mx-auto max-w-2xl p-6">
      <p className="text-sm uppercase tracking-wide text-muted-foreground">Financial Platform</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">Minha carteira</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Shell RSC do Business Program 3. Checkout e meios de pagamento atuais não foram alterados.
      </p>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Disponível</p>
          <p className="text-xl font-medium">{((w.available_cents ?? 0) / 100).toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Cashback</p>
          <p className="text-xl font-medium">{((w.cashback_cents ?? 0) / 100).toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Store credit</p>
          <p className="text-xl font-medium">{((w.store_credit_cents ?? 0) / 100).toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Gift cards</p>
          <p className="text-xl font-medium">{((w.gift_card_cents ?? 0) / 100).toFixed(2)}</p>
        </div>
      </section>
    </main>
  );
}
