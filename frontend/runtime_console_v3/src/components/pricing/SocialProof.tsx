"use client";

import { useQuery } from "@tanstack/react-query";
import { BadgeCheck } from "lucide-react";

const TESTIMONIALS = [
  {
    quote: "Salvou meu FNM quando ninguém sabia a regra de stack.",
    author: "Carlos M.",
    tcg: "Magic: The Gathering",
    verified: true,
  },
  {
    quote: "Uso na loja para treinar judges novatos.",
    author: "Ana L.",
    tcg: "LGS · São Paulo",
    verified: true,
  },
  {
    quote: "Veredito com fonte oficial — isso muda o jogo.",
    author: "Pedro R.",
    tcg: "Yu-Gi-Oh!",
    verified: true,
  },
];

export function SocialProof() {
  const { data } = useQuery({
    queryKey: ["pricing-stats"],
    queryFn: async () => {
      const res = await fetch("/api/pricing/stats");
      if (!res.ok) return { proCount: 0, totalPlayers: 0 };
      return res.json() as Promise<{ proCount: number; totalPlayers: number }>;
    },
    staleTime: 60_000,
  });

  const proLabel =
    data && data.proCount > 0
      ? `${data.proCount.toLocaleString("pt-BR")}+ jogadores Pro`
      : "Comunidade crescente de jogadores competitivos";

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-5xl">
        <p className="mb-2 text-center text-sm font-semibold text-primary-light">{proLabel}</p>
        <h2 className="mb-2 text-center text-2xl font-bold text-white">O que dizem os jogadores</h2>
        <p className="mb-10 text-center text-muted-foreground">Depoimentos de quem usa a mesa no dia a dia</p>

        <div className="grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <blockquote
              key={t.author}
              className="judge-card surface-card rounded-2xl p-5 text-left shadow-lg"
            >
              <p className="mb-4 text-sm leading-relaxed text-foreground/90">&ldquo;{t.quote}&rdquo;</p>
              <footer className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.author}</p>
                  <p className="text-xs text-muted-foreground/70">{t.tcg}</p>
                </div>
                {t.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-primary-light">
                    <BadgeCheck className="h-3 w-3" aria-hidden />
                    Verificado
                  </span>
                )}
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
