import type { Metadata } from "next";
import Link from "next/link";
import { ProfileNav } from "@/components/profile-v2/ProfileNav";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { withCanonical } from "@/lib/page-metadata";

export const metadata: Metadata = withCanonical("/perfil", {
  title: "Meu Perfil",
  description:
    "Sua identidade como jogador no JudgeTCG — coleção, decks, marketplace, conquistas e jornada.",
  robots: { index: false, follow: false },
});

/** Layout legado (pré Profile V2). */
function LegacyPerfilLayout({ children }: { children: React.ReactNode }) {
  const NAV = [
    { href: "/perfil", label: "Perfil" },
    { href: "/colecao", label: "Coleção" },
    { href: "/perfil/pedidos", label: "Pedidos" },
    { href: "/perfil/seguidos", label: "Seguidos" },
    { href: "/perfil/alertas", label: "Alertas" },
  ];

  return (
    <>
      <nav
        aria-label="Navegação do perfil"
        className="border-b border-border bg-background/80"
      >
        <div className="container mx-auto flex gap-1 overflow-x-auto px-4 py-2 scrollbar-hide">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
      {children}
    </>
  );
}

export default function PerfilLayout({ children }: { children: React.ReactNode }) {
  if (!isFeatureEnabled("PLAYER_PROFILE_V2")) {
    return <LegacyPerfilLayout>{children}</LegacyPerfilLayout>;
  }

  return (
    <MobileLayout>
      <div className="page-container py-6 lg:py-8">
        <ProfileNav />
        <div className="mt-6">{children}</div>
      </div>
    </MobileLayout>
  );
}
