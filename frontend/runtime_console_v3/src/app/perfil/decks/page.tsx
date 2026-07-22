"use client";

import { ProfileDecksPanel } from "@/components/profile-v2/ProfileDecksPanel";
import { isFeatureEnabled } from "@/lib/feature-flags";
import Link from "next/link";

export default function PerfilDecksPage() {
  if (!isFeatureEnabled("PLAYER_PROFILE_V2")) {
    return (
      <p className="p-6 text-sm text-muted-foreground">
        Profile V2 desativado.{" "}
        <Link href="/decks" className="text-primary hover:underline">
          Ir para decks
        </Link>
      </p>
    );
  }
  return <ProfileDecksPanel />;
}
