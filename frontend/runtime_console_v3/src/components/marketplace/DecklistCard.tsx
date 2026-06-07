import Link from "next/link";

type Props = {
  id: string;
  name: string;
  gameCode: string;
  priceCents: number;
  sellerName?: string;
  rating?: number;
  salesCount?: number;
};

export function DecklistCard({ id, name, gameCode, priceCents, sellerName, rating, salesCount }: Props) {
  return (
    <article className="rounded-xl border border-slate-700 p-4">
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="text-sm text-slate-400">
        {gameCode} · ⭐ {Number(rating ?? 0).toFixed(1)} · {salesCount ?? 0} vendas
      </p>
      <p className="mt-1 text-sm">👤 {sellerName ?? "Vendedor"}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="font-semibold text-amber-400">
          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(priceCents / 100)}
        </span>
        <Link href={`/marketplace/${id}`} className="rounded-lg bg-amber-500 px-3 py-1 text-sm font-semibold text-slate-900">
          Ver
        </Link>
      </div>
    </article>
  );
}
