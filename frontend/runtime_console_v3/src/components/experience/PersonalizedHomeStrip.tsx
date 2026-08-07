"use client";

import Link from "next/link";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import {
  BookMarked,
  Layers,
  Bell,
  Store,
  Heart,
  Star,
} from "lucide-react";

const LINKS = [
  {
    href: "/colecao",
    label: "Continue sua coleção",
    hint: "Progresso e inventário",
    icon: BookMarked,
  },
  {
    href: "/decks",
    label: "Continue seu deck",
    hint: "Decks e builder",
    icon: Layers,
  },
  {
    href: "/alertas",
    label: "Alertas",
    hint: "Preços e novidades",
    icon: Bell,
  },
  {
    href: "/loja/busca",
    label: "Marketplace",
    hint: "Ofertas ativas",
    icon: Store,
  },
  {
    href: "/wishlist",
    label: "Wishlist",
    hint: "Cartas desejadas",
    icon: Heart,
  },
  {
    href: "/perfil/seguidos",
    label: "Favoritos",
    hint: "Lojas e cartas",
    icon: Star,
  },
] as const;

/**
 * RecommendationSurface — authenticated shortcuts using existing routes/APIs.
 * No new recommendation BC.
 */
export function PersonalizedHomeStrip() {
  const { user, loading } = useJudgeAuth();

  if (loading || !user) return null;

  return (
    <section
      className="border-b border-border bg-muted/30 py-8"
      data-testid="personalized-home"
      aria-label="Continuar no JudgeTCG"
    >
      <div className="container mx-auto max-w-6xl px-4">
        <h2 className="text-lg font-semibold text-foreground">Continue de onde parou</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Atalhos da sua conta — coleção, decks e marketplace.
        </p>
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex h-full flex-col gap-2 rounded-xl border border-border bg-card p-4 transition hover:border-primary/40"
                >
                  <Icon className="h-5 w-5 text-primary" aria-hidden />
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                  <span className="text-xs text-muted-foreground">{item.hint}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
