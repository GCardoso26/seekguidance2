"use client";

import { ProfilePurchasesPanel } from "@/components/profile-v2/ProfilePurchasesPanel";
import { isFeatureEnabled } from "@/lib/feature-flags";
import Link from "next/link";

export default function PerfilComprasPage() {
  if (!isFeatureEnabled("PLAYER_PROFILE_V2")) {
    return (
      <p className="p-6 text-sm text-muted-foreground">
        Profile V2 desativado.{" "}
        <Link href="/marketplace/orders" className="text-primary hover:underline">
          Pedidos
        </Link>
      </p>
    );
  }
  return <ProfilePurchasesPanel />;
}
