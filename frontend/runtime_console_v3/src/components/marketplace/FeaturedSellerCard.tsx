import Link from "next/link";
import { Star, Store } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export interface FeaturedSeller {
  id: string;
  shopName: string;
  avatarUrl?: string | null;
  rating: number;
  reviewCount?: number;
  specialties?: string[];
  listingCount?: number;
}

interface FeaturedSellerCardProps {
  seller: FeaturedSeller;
}

export function FeaturedSellerCard({ seller }: FeaturedSellerCardProps) {
  const initials = seller.shopName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className="border-border/60 bg-card/50 transition hover:border-primary/30 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {seller.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={seller.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{seller.shopName}</p>
            <div className="flex items-center gap-1 text-sm text-amber-500">
              <Star className="h-3.5 w-3.5 fill-current" />
              <span>{seller.rating.toFixed(1)}</span>
              {seller.reviewCount !== undefined && (
                <span className="text-xs text-muted-foreground">({seller.reviewCount})</span>
              )}
            </div>
          </div>
        </div>

        {seller.specialties && seller.specialties.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {seller.specialties.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {seller.listingCount !== undefined && (
          <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Store className="h-3 w-3" />
            {seller.listingCount.toLocaleString("pt-BR")} listagens
          </p>
        )}

        <Link
          href={`/vendedor/${seller.id}`}
          className="mt-3 inline-block text-sm text-primary hover:underline"
        >
          Visitar loja →
        </Link>
      </CardContent>
    </Card>
  );
}
