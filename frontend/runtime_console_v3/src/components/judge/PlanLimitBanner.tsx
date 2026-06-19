"use client";

import { Crown } from "lucide-react";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useUpgradeModal } from "@/components/premium/UpgradeModalProvider";
import type { PlanFeature } from "@/lib/plan-limits/constants";

type Props = {
  variant?: "questions" | "tcg" | "export" | "torneios";
  tcgName?: string;
};

const FEATURE_MAP: Record<NonNullable<Props["variant"]>, PlanFeature> = {
  questions: "consultas",
  tcg: "tcgs",
  export: "export",
  torneios: "torneios",
};

export function PlanLimitBanner({ variant = "questions", tcgName }: Props) {
  const { dailyLimit, dailyUsed, remainingToday, isPro } = usePlanLimits();
  const { showUpgrade } = useUpgradeModal();

  if (isPro) return null;

  const openUpgrade = () => showUpgrade(FEATURE_MAP[variant]);

  if (variant === "questions") {
    return (
      <div className="rounded-xl border border-luxury-gold/30 bg-luxury-gold/10 p-4 text-center">
        <p className="text-sm text-luxury-gold-light">
          Você usou {dailyUsed}/{dailyLimit} consultas hoje.
          {remainingToday === 0
            ? " O limite diário foi atingido."
            : ` Restam ${remainingToday} consultas.`}
        </p>
        <p className="mt-1 text-xs text-luxury-mist">
          Assine Pro para consultas ilimitadas e todos os 14 jogos.
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={openUpgrade}
            className="inline-flex items-center gap-1.5 rounded-full bg-luxury-gold px-4 py-2 text-sm font-semibold text-luxury-onyx hover:bg-luxury-gold-light"
          >
            <Crown className="h-4 w-4" aria-hidden />
            Assinar Pro
          </button>
          {remainingToday === 0 && (
            <span className="rounded-lg border border-white/10 px-4 py-2 text-xs text-luxury-mist">
              Amanhã você terá mais {dailyLimit}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (variant === "tcg") {
    return (
      <div className="luxury-card rounded-xl p-4 text-center">
        <p className="text-sm text-luxury-frost">
          <span className="font-semibold">{tcgName ?? "Este jogo"}</span> não faz parte da sua
          seleção Free.
        </p>
        <p className="mt-1 text-xs text-luxury-mist">
          Escolha até 5 jogos no onboarding ou assine Pro para os 14 TCGs.
        </p>
        <button
          type="button"
          onClick={openUpgrade}
          className="mt-3 inline-block rounded-full bg-luxury-gold px-4 py-2 text-sm font-semibold text-luxury-onyx hover:bg-luxury-gold-light"
        >
          Fazer upgrade
        </button>
      </div>
    );
  }

  if (variant === "torneios") {
    return (
      <div className="luxury-card rounded-xl p-4 text-center">
        <p className="text-sm text-luxury-frost">Limite de 1 torneio/mês no plano Free.</p>
        <p className="mt-1 text-xs text-luxury-mist">
          Assine Pro para criar torneios ilimitados.
        </p>
        <button
          type="button"
          onClick={openUpgrade}
          className="mt-3 inline-block rounded-full bg-luxury-gold px-4 py-2 text-sm font-semibold text-luxury-onyx hover:bg-luxury-gold-light"
        >
          Assinar Pro
        </button>
      </div>
    );
  }

  return (
    <div className="luxury-card rounded-xl p-4 text-center">
      <p className="text-sm text-luxury-frost">Exportar histórico é um recurso Pro.</p>
      <button
        type="button"
        onClick={openUpgrade}
        className="mt-2 inline-block text-sm text-luxury-gold hover:text-luxury-gold-light"
      >
        Ver planos Pro →
      </button>
    </div>
  );
}
