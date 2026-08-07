"use client";

import { ProfileSettingsPanel } from "@/components/profile-v2/ProfileSettingsPanel";
import { isFeatureEnabled } from "@/lib/feature-flags";
import Link from "next/link";

export default function PerfilConfiguracoesPage() {
  if (!isFeatureEnabled("PLAYER_PROFILE_V2")) {
    return (
      <p className="p-6 text-sm text-muted-foreground">
        Profile V2 desativado.{" "}
        <Link href="/perfil" className="text-primary hover:underline">
          Editar perfil
        </Link>
      </p>
    );
  }
  return <ProfileSettingsPanel />;
}
