"use client";

import { ProfileSalesPanel } from "@/components/profile-v2/ProfileSalesPanel";
import { isFeatureEnabled } from "@/lib/feature-flags";
import Link from "next/link";

export default function PerfilVendasPage() {
  if (!isFeatureEnabled("PLAYER_PROFILE_V2")) {
    return (
      <p className="p-6 text-sm text-muted-foreground">
        Profile V2 desativado.{" "}
        <Link href="/vendedor/painel" className="text-primary hover:underline">
          Painel vendedor
        </Link>
      </p>
    );
  }
  return <ProfileSalesPanel />;
}
