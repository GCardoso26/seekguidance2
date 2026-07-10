import Image from "next/image";
import { BadgeCheck, MapPin, Plane, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { MarketplaceSellerProfile } from "@/lib/seller-profile-query";
import { cn } from "@/lib/utils";

type Props = {
  seller: MarketplaceSellerProfile;
};

export function SellerProfileHeader({ seller }: Props) {
  return (
    <header className="relative overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-primary/10 to-transparent"
        aria-hidden
      />
      <div className="relative p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-border bg-card shadow-card">
            {seller.avatar_url ? (
              <Image src={seller.avatar_url} alt="" fill className="object-contain p-2" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-primary">
                {seller.display_name.charAt(0)}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-h1 font-semibold text-foreground">{seller.display_name}</h1>
              <span className="text-small text-muted-foreground">@{seller.username}</span>
              {seller.user_type === "professional" && (
                <Badge variant="default" className="gap-1">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Pro
                </Badge>
              )}
              {seller.can_sell_via_hub && (
                <Badge variant="warning">Judge Hub</Badge>
              )}
              {seller.on_vacation && (
                <Badge variant="warning">Em férias</Badge>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-small text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Star className="h-4 w-4 fill-primary text-primary" />
                {seller.rating.toFixed(1)} ({seller.total_reviews} avaliações)
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {seller.country_name ?? seller.country_code}
              </span>
              {seller.response_time_hours != null && (
                <span className="inline-flex items-center gap-1">
                  <Plane className="h-4 w-4" />
                  Resposta ~{seller.response_time_hours}h
                </span>
              )}
            </div>
            {seller.store_description && (
              <p className="mt-3 text-small text-muted-foreground">{seller.store_description}</p>
            )}
          </div>
        </div>
        {seller.policies && (
          <dl className={cn("mt-6 grid gap-3 border-t border-border pt-4 text-small sm:grid-cols-3")}>
            {seller.policies.shipping && (
              <div>
                <dt className="text-caption font-medium text-foreground">Envio</dt>
                <dd className="text-muted-foreground">{seller.policies.shipping}</dd>
              </div>
            )}
            {seller.policies.returns && (
              <div>
                <dt className="text-caption font-medium text-foreground">Trocas</dt>
                <dd className="text-muted-foreground">{seller.policies.returns}</dd>
              </div>
            )}
            {seller.policies.grading && (
              <div>
                <dt className="text-caption font-medium text-foreground">Condição</dt>
                <dd className="text-muted-foreground">{seller.policies.grading}</dd>
              </div>
            )}
          </dl>
        )}
      </div>
    </header>
  );
}
