"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { MobileLayout } from "@/components/layout/MobileLayout";

const GamificationProfilePage = dynamic(
  () =>
    import("@/components/gamification/GamificationProfilePage").then((m) => m.GamificationProfilePage),
  { loading: () => <p className="text-sm text-luxury-mist">Carregando…</p>, ssr: false },
);

export default function ProfileGamificationRoute() {
  return (
    <MobileLayout>
      <div className="container mx-auto px-4 py-8" data-testid="profile-gamification-route">
        <Link href="/perfil" className="text-sm text-luxury-mist hover:text-luxury-gold">
          ← Meu perfil
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-luxury-frost">Gamificação</h1>
        <p className="mt-1 text-sm text-luxury-mist">XP, nível e conquistas</p>
        <div className="mt-6">
          <GamificationProfilePage />
        </div>
      </div>
    </MobileLayout>
  );
}
