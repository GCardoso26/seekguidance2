"use client";

import Link from "next/link";
import { NotificationPreferences } from "@/components/notifications/NotificationPreferences";
import { publicProfilePath } from "@/lib/profile-v2";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import { isFeatureEnabled } from "@/lib/feature-flags";

/**
 * Configurações isoladas do hub — identidade fica no Resumo.
 * Edição completa permanece em /player/me (legado).
 */
export function ProfileSettingsPanel() {
  const { data: profile } = usePlayerProfile("me");
  const publicEnabled = isFeatureEnabled("PLAYER_PUBLIC_PROFILE");

  return (
    <div className="space-y-8" data-testid="profile-settings-panel">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Configurações</h1>
        <p className="text-small text-muted-foreground">
          Preferências e privacidade. O hub /perfil é a jornada do jogador — não um painel admin.
        </p>
      </header>

      <section className="space-y-3 rounded-xl border border-border p-5">
        <h2 className="text-sm font-medium">Perfil público</h2>
        {profile?.handle && publicEnabled ? (
          <p className="text-small text-muted-foreground">
            URL amigável:{" "}
            <Link
              href={publicProfilePath(profile.handle)}
              className="text-primary hover:underline"
            >
              {publicProfilePath(profile.handle)}
            </Link>
          </p>
        ) : (
          <p className="text-small text-muted-foreground">
            Perfil público {publicEnabled ? "disponível após criar handle." : "desativado (flag)."}
          </p>
        )}
        <Link href="/player/me" className="inline-block text-small text-primary hover:underline">
          Editar nome, bio, avatar e jogos favoritos
        </Link>
      </section>

      <section className="space-y-3 rounded-xl border border-border p-5">
        <h2 className="text-sm font-medium">Notificações</h2>
        <NotificationPreferences />
      </section>

      <section className="space-y-2 rounded-xl border border-border p-5">
        <h2 className="text-sm font-medium">Atalhos</h2>
        <ul className="space-y-1 text-small">
          <li>
            <Link href="/perfil/alertas" className="text-primary hover:underline">
              Alertas de preço
            </Link>
          </li>
          <li>
            <Link href="/perfil/seguidos" className="text-primary hover:underline">
              Seguidos
            </Link>
          </li>
          <li>
            <Link href="/assinatura" className="text-primary hover:underline">
              Assinatura
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
