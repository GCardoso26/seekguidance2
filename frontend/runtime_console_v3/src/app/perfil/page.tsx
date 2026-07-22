"use client";

import dynamic from "next/dynamic";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { ProfileDashboard } from "@/components/profile-v2/ProfileDashboard";
import { ProfileSkeleton } from "@/components/ui/skeletons";

const LegacyMyProfile = dynamic(() => import("@/app/player/me/page"), {
  loading: () => <ProfileSkeleton />,
});

export default function PerfilPage() {
  if (!isFeatureEnabled("PLAYER_PROFILE_V2")) {
    return <LegacyMyProfile />;
  }
  return <ProfileDashboard />;
}
