import Link from "next/link";

type Props = {
  slug: string;
  name: string;
  city?: string;
  averageRating?: number;
  reviewCount?: number;
  verified?: boolean;
};

export function StoreCard({ slug, name, city, averageRating, reviewCount, verified }: Props) {
  return (
    <Link href={`/stores/${slug}`} className="block rounded-xl border border-slate-700 p-4 hover:border-amber-500/40">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold">{name}</h3>
        {verified && <span className="text-xs text-emerald-400">✓ Verificada</span>}
      </div>
      <p className="mt-1 text-sm text-slate-400">
        {city ?? "Brasil"} · ⭐ {Number(averageRating ?? 0).toFixed(1)} ({reviewCount ?? 0})
      </p>
    </Link>
  );
}
