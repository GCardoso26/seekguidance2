import Link from "next/link";
import { TrustTierBadge } from "@/components/store/TrustTierBadge";

type Props = {
  slug: string;
  name: string;
  city?: string;
  averageRating?: number;
  reviewCount?: number;
  verified?: boolean;
  trustTier?: string | { id: string; label: string; emoji?: string } | null;
};

export function StoreCard({
  slug,
  name,
  city,
  averageRating,
  reviewCount,
  verified,
  trustTier,
}: Props) {
  const tier = trustTier || (verified ? "verified" : null);
  return (
    <Link
      href={`/stores/${slug}`}
      className="block rounded-xl border border-border p-4 transition hover:border-primary/40"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold">{name}</h3>
        <TrustTierBadge tier={tier} />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {city ?? "Brasil"} · ⭐ {Number(averageRating ?? 0).toFixed(1)} ({reviewCount ?? 0})
      </p>
    </Link>
  );
}
