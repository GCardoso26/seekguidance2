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

      <div className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-center">

        <p className="text-sm text-primary">

          Você usou {dailyUsed}/{dailyLimit} consultas hoje.

          {remainingToday === 0

            ? " O limite diário foi atingido."

            : ` Restam ${remainingToday} consultas.`}

        </p>

        <p className="mt-1 text-xs text-muted-foreground">

          Assine Pro para consultas ilimitadas e todos os 14 jogos.

        </p>

        <div className="mt-3 flex flex-wrap justify-center gap-2">

          <button

            type="button"

            onClick={openUpgrade}

            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90-light"

          >

            <Crown className="h-4 w-4" aria-hidden />

            Assinar Pro

          </button>

          {remainingToday === 0 && (

            <span className="rounded-lg border border-border px-4 py-2 text-xs text-muted-foreground">

              Amanhã você terá mais {dailyLimit}

            </span>

          )}

        </div>

      </div>

    );

  }



  if (variant === "tcg") {

    return (

      <div className="surface-card rounded-xl p-4 text-center">

        <p className="text-sm text-foreground">

          <span className="font-semibold">{tcgName ?? "Este jogo"}</span> não faz parte da sua

          seleção Free.

        </p>

        <p className="mt-1 text-xs text-muted-foreground">

          Escolha até 5 jogos no onboarding ou assine Pro para os 14 TCGs.

        </p>

        <button

          type="button"

          onClick={openUpgrade}

          className="mt-3 inline-block rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90-light"

        >

          Fazer upgrade

        </button>

      </div>

    );

  }



  if (variant === "torneios") {

    return (

      <div className="surface-card rounded-xl p-4 text-center">

        <p className="text-sm text-foreground">Limite de 1 torneio/mês no plano Free.</p>

        <p className="mt-1 text-xs text-muted-foreground">

          Assine Pro para criar torneios ilimitados.

        </p>

        <button

          type="button"

          onClick={openUpgrade}

          className="mt-3 inline-block rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90-light"

        >

          Assinar Pro

        </button>

      </div>

    );

  }



  return (

    <div className="surface-card rounded-xl p-4 text-center">

      <p className="text-sm text-foreground">Exportar histórico é um recurso Pro.</p>

      <button

        type="button"

        onClick={openUpgrade}

        className="mt-2 inline-block text-sm text-primary hover:text-primary"

      >

        Ver planos Pro →

      </button>

    </div>

  );

}


