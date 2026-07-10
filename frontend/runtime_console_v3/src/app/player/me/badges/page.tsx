"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { BadgeCard, type BadgeView } from "@/components/player/BadgeCard";

export default function BadgesPage() {
  const { data, refetch } = useQuery({
    queryKey: ["badges"],
    queryFn: async () => {
      const res = await fetch("/api/badges");
      if (!res.ok) throw new Error("Falha ao carregar badges");
      return res.json() as Promise<{ badges: BadgeView[] }>;
    },
  });

  useEffect(() => {
    void fetch("/api/badges/check", { method: "POST" }).then(() => refetch());
  }, [refetch]);

  useEffect(() => {
    const earned = data?.badges.filter((b) => b.earned) ?? [];
    if (earned.length === 1) {
      void confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
    }
  }, [data]);

  const badges = data?.badges ?? [];
  const earnedCount = badges.filter((b) => b.earned).length;

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <Link href="/perfil" className="text-sm text-muted-foreground">
          ← Meu perfil
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Badges</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {earnedCount}/{badges.length} conquistados
        </p>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {badges.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}
