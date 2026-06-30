"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { MobileLayout } from "@/components/layout/MobileLayout";

const BadgesGrid = dynamic(
  () => import("@/components/gamification/BadgesGrid").then((m) => m.BadgesGrid),
  { loading: () => <p className="text-sm text-luxury-mist">Carregando…</p>, ssr: false },
);

export default function BadgesRoutePage() {
  return (
    <MobileLayout>
      <div className="container mx-auto px-4 py-8" data-testid="badges-route">
        <Link href="/profile/gamification" className="text-sm text-luxury-mist hover:text-luxury-gold">
          ← Gamificação
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-luxury-frost">Badges</h1>
        <p className="mt-1 text-sm text-luxury-mist">Conquistas desbloqueadas e bloqueadas</p>
        <div className="mt-6">
          <BadgesGrid />
        </div>
      </div>
    </MobileLayout>
  );
}
