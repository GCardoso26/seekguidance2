"use client";

import { ProfileHistoryPanel } from "@/components/profile-v2/ProfileHistoryPanel";
import { isFeatureEnabled } from "@/lib/feature-flags";
import Link from "next/link";

export default function PerfilHistoricoPage() {
  if (!isFeatureEnabled("PLAYER_PROFILE_V2")) {
    return (
      <p className="p-6 text-sm text-muted-foreground">
        Profile V2 desativado.{" "}
        <Link href="/player/me/history" className="text-primary hover:underline">
          Histórico
        </Link>
      </p>
    );
  }
  return <ProfileHistoryPanel />;
}
