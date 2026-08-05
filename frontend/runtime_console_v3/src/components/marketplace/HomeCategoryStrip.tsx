"use client";

import Link from "next/link";
import { trackEvent } from "@/lib/analytics";

const CATEGORIES = [
  {
    href: "/loja/singles",
    title: "Singles",
    description: "Cartas avulsas por jogo",
    testId: "home-cat-singles",
  },
  {
    href: "/loja/selados",
    title: "Selados",
    description: "Boosters, displays e kits",
    testId: "home-cat-selados",
  },
  {
    href: "/loja/acessorios",
    title: "Acessórios",
    description: "Sleeves, playmats, deck boxes",
    testId: "home-cat-acessorios",
  },
] as const;

/** Três entradas principais — ≤2 cliques até a prateleira. */
export function HomeCategoryStrip() {
  return (
    <section className="border-b border-border py-8" data-testid="home-category-strip">
      <div className="container mx-auto px-4">
        <h2 className="text-h2 font-semibold text-foreground">Onde comprar</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Singles, selados e acessórios — ofertas reais quando existirem.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-3">
          {CATEGORIES.map((c) => (
            <li key={c.href}>
              <Link
                href={c.href}
                data-testid={c.testId}
                className="block rounded-xl border border-border bg-card p-5 transition hover:border-primary/40"
                onClick={() => {
                  void trackEvent("category_ctr", { href: c.href, source: "home" });
                }}
              >
                <p className="text-lg font-semibold">{c.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
