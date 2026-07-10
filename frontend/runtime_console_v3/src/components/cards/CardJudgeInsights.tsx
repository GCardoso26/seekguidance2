"use client";

import Link from "next/link";
import { Scale } from "lucide-react";
import type { UnifiedCard } from "@/types/card";
import { cn } from "@/lib/utils";
import { useJudgeAuth } from "@/features/auth/AuthProvider";

type Props = {
  card: UnifiedCard;
  cardId: string;
  className?: string;
};

export function CardJudgeInsights({ card, cardId, className }: Props) {
  const { user } = useJudgeAuth();
  const roles = (user?.app_metadata?.roles as string[] | undefined) ?? [];
  const isJudge =
    roles.includes("judge") ||
    roles.includes("admin") ||
    Boolean(user?.user_metadata?.is_judge);

  const rulings = card.rulings ?? [];
  const erratas = card.erratas ?? [];

  if (!rulings.length && !erratas.length && !card.oracleText) {
    return null;
  }

  return (
    <section
      className={cn("rounded-xl border border-amber-500/20 bg-amber-500/5 p-4", className)}
      aria-labelledby="judge-insights-title"
      data-testid="card-judge-insights"
    >
      <div className="flex items-center gap-2">
        <Scale className="h-4 w-4 text-amber-600" aria-hidden />
        <h2 id="judge-insights-title" className="text-sm font-semibold">
          Judge Insights
        </h2>
        {!isJudge && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            Público
          </span>
        )}
      </div>

      {card.oracleText && (
        <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{card.oracleText}</div>
      )}

      {erratas.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Erratas</h3>
          <ul className="mt-2 space-y-2">
            {erratas.map((e, i) => (
              <li key={i} className="rounded-lg border border-border/60 bg-background/60 p-2 text-xs">
                {e.date && <span className="text-muted-foreground">{e.date} · </span>}
                {e.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      {rulings.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rulings</h3>
          <ul className="mt-2 space-y-2">
            {rulings.map((r, i) => (
              <li key={i} className="text-xs leading-relaxed">
                {r.date && <span className="text-muted-foreground">{r.date}: </span>}
                {r.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3 text-xs">
        <Link href={`/regras/carta/${cardId}`} className="text-primary hover:underline">
          Abrir no Judge
        </Link>
        <Link href="/regras" className="text-muted-foreground hover:underline">
          Documentação oficial
        </Link>
      </div>
    </section>
  );
}
