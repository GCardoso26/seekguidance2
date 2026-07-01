import Image from "next/image";
import { BadgeCheck, MapPin, Plane, Star } from "lucide-react";
import type { MarketplaceSellerProfile } from "@/lib/seller-profile-query";
import { cn } from "@/lib/utils";

type Props = {
  seller: MarketplaceSellerProfile;
};

export function SellerProfileHeader({ seller }: Props) {
  return (
    <header className="rounded-2xl border border-white/10 bg-luxury-obsidian/80 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/5">
          {seller.avatar_url ? (
            <Image src={seller.avatar_url} alt="" fill className="object-contain p-2" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-luxury-gold">
              {seller.display_name.charAt(0)}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-luxury-frost">{seller.display_name}</h1>
            <span className="text-sm text-luxury-mist">@{seller.username}</span>
            {seller.user_type === "professional" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-luxury-gold/15 px-2 py-0.5 text-xs font-medium text-luxury-gold">
                <BadgeCheck className="h-3.5 w-3.5" />
                Pro
              </span>
            )}
            {seller.can_sell_via_hub && (
              <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-xs font-medium text-orange-400">
                Judge Hub
              </span>
            )}
            {seller.on_vacation && (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-400">
                Em férias
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-luxury-mist">
            <span className="inline-flex items-center gap-1">
              <Star className="h-4 w-4 fill-luxury-gold text-luxury-gold" />
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
            <p className="mt-3 text-sm text-luxury-mist">{seller.store_description}</p>
          )}
        </div>
      </div>
      {seller.policies && (
        <dl className={cn("mt-6 grid gap-3 border-t border-white/10 pt-4 text-sm sm:grid-cols-3")}>
          {seller.policies.shipping && (
            <div>
              <dt className="font-medium text-luxury-frost">Envio</dt>
              <dd className="text-luxury-mist">{seller.policies.shipping}</dd>
            </div>
          )}
          {seller.policies.returns && (
            <div>
              <dt className="font-medium text-luxury-frost">Trocas</dt>
              <dd className="text-luxury-mist">{seller.policies.returns}</dd>
            </div>
          )}
          {seller.policies.grading && (
            <div>
              <dt className="font-medium text-luxury-frost">Condição</dt>
              <dd className="text-luxury-mist">{seller.policies.grading}</dd>
            </div>
          )}
        </dl>
      )}
    </header>
  );
}
