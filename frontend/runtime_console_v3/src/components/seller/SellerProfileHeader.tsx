"use client";

import Link from "next/link";
import { FollowButton } from "@/components/social/FollowButton";
import { usePathname } from "next/navigation";
import type { SellerProfile } from "@/types/seller";

const TABS = [
  { href: "", label: "Sobre" },
  { href: "/cards", label: "Cards" },
  { href: "/avaliacoes", label: "Avaliações" },
  { href: "/estatisticas", label: "Estatísticas" },
] as const;

interface Props {
  sellerId: string;
  profile: SellerProfile;
}

export function SellerProfileHeader({ sellerId, profile }: Props) {
  const rating = profile.rating_average.toFixed(1);
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
      {profile.banner_url && (
        <div
          className="h-32 bg-cover bg-center"
          style={{ backgroundImage: `url(${profile.banner_url})` }}
        />
      )}
      <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-luxury-gold/20 text-2xl font-bold text-luxury-gold">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
          ) : (
            (profile.shop_name?.[0] ?? "?").toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">{profile.shop_name}</h1>
          <p className="mt-1 text-sm text-luxury-mist">
            ⭐ {rating} · {profile.rating_count} avaliações · {profile.total_sales} vendas
            {profile.location ? ` · ${profile.location}` : ""}
          </p>
          {profile.handle && (
            <p className="text-xs text-luxury-mist">@{profile.handle}</p>
          )}
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <FollowButton playerId={sellerId} />
          <Link
            href={`/social/messages/${sellerId}`}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
          >
            Mensagem
          </Link>
        </div>
      </div>
    </div>
  );
}

export function SellerTabs({ sellerId }: { sellerId: string }) {
  const pathname = usePathname();
  const base = `/vendedor/${sellerId}`;

  return (
    <nav className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
      {TABS.map((tab) => {
        const href = `${base}${tab.href}`;
        const active =
          tab.href === ""
            ? pathname === base || pathname === `${base}/`
            : pathname.startsWith(`${base}${tab.href}`);
        return (
          <Link
            key={tab.href}
            href={href}
            className={`rounded-full px-4 py-1.5 text-sm ${
              active ? "bg-luxury-gold text-luxury-onyx" : "bg-white/10 hover:bg-white/15"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
