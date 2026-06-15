"use client";

import Link from "next/link";
import { Crown } from "lucide-react";
import { usePlanLimits } from "@/hooks/usePlanLimits";

type Props = {
  variant?: "questions" | "tcg" | "export";
  tcgName?: string;
};

export function PlanLimitBanner({ variant = "questions", tcgName }: Props) {
  const { dailyLimit, dailyUsed, remainingToday, isPro } = usePlanLimits();

  if (isPro) return null;

  if (variant === "questions") {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-center">
        <p className="text-sm text-amber-100">
          Você usou {dailyUsed}/{dailyLimit} consultas hoje.
          {remainingToday === 0
            ? " O limite diário foi atingido."
            : ` Restam ${remainingToday} consultas.`}
        </p>
        <p className="mt-1 text-xs text-amber-200/80">
          Assine Pro para consultas ilimitadas e todos os 14 jogos.
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Link
            href="/pricing?from=paywall"
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400"
          >
            <Crown className="h-4 w-4" aria-hidden />
            Ver planos
          </Link>
          {remainingToday === 0 && (
            <span className="rounded-lg border border-slate-600 px-4 py-2 text-xs text-slate-400">
              Amanhã você terá mais {dailyLimit}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (variant === "tcg") {
    return (
      <div className="rounded-xl border border-slate-600 bg-slate-800/80 p-4 text-center">
        <p className="text-sm text-slate-200">
          <span className="font-semibold">{tcgName ?? "Este jogo"}</span> está disponível no plano
          Spike.
        </p>
        <p className="mt-1 text-xs text-slate-400">
          O plano gratuito inclui Magic, Pokémon, Yu-Gi-Oh!, Lorcana e One Piece.
        </p>
        <Link
          href="/pricing?from=paywall-tcg"
          className="mt-3 inline-block rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900"
        >
          Fazer upgrade
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-600 bg-slate-800/80 p-4 text-center">
      <p className="text-sm text-slate-200">Exportar histórico é um recurso Pro.</p>
      <Link href="/pricing?from=export" className="mt-2 inline-block text-sm text-amber-400 hover:underline">
        Ver planos →
      </Link>
    </div>
  );
}
