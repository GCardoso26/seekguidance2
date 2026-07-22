"use client";

import { ProfileWishlistPanel } from "@/components/profile-v2/ProfileWishlistPanel";
import { isFeatureEnabled } from "@/lib/feature-flags";
import Link from "next/link";

export default function PerfilWishlistPage() {
  if (!isFeatureEnabled("PLAYER_PROFILE_V2")) {
    return (
      <p className="p-6 text-sm text-muted-foreground">
        Profile V2 desativado.{" "}
        <Link href="/colecao/wishlist" className="text-primary hover:underline">
          Wishlist
        </Link>
      </p>
    );
  }
  return <ProfileWishlistPanel />;
}
