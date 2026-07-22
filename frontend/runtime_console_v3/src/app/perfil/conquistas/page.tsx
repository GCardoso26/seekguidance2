"use client";

import { ProfileAchievementsPanel } from "@/components/profile-v2/ProfileAchievementsPanel";
import { isFeatureEnabled } from "@/lib/feature-flags";
import Link from "next/link";

export default function PerfilConquistasPage() {
  if (!isFeatureEnabled("PLAYER_PROFILE_V2")) {
    return (
      <p className="p-6 text-sm text-muted-foreground">
        Profile V2 desativado.{" "}
        <Link href="/profile/gamification" className="text-primary hover:underline">
          Gamificação
        </Link>
      </p>
    );
  }
  return <ProfileAchievementsPanel />;
}
