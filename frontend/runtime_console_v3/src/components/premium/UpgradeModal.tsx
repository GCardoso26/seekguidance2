"use client";

import { useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, Crown, X } from "lucide-react";
import { useCheckout } from "@/hooks/useSubscription";
import { usePlanGate } from "@/hooks/usePlanGate";
import { trackEvent } from "@/lib/analytics";
import type { PlanFeature } from "@/lib/plan-limits/constants";
import { cn } from "@/lib/utils";

const FEATURE_TITLES: Record<PlanFeature, string> = {
  consultas: "consultas diárias",
  tcgs: "jogos disponíveis",
  historico: "histórico na nuvem",
  torneios: "criação de torneios",
  export: "exportar histórico",
};

const PRO_BENEFITS = [
  "Consultas ilimitadas ao juiz",
  "Todos os 14 TCGs",
  "Histórico na nuvem",
  "Exportar vereditos (PDF/QR)",
  "Criar torneios ilimitados",
  "Suporte prioritário",
];

type Props = {
  open: boolean;
  feature: PlanFeature;
  onClose: () => void;
  billingCycle?: "monthly" | "annual";
};

export function UpgradeModal({ open, feature, onClose, billingCycle = "monthly" }: Props) {
  const gate = usePlanGate(feature);
  const checkout = useCheckout();

  useEffect(() => {
    if (open) {
      void trackEvent("upgrade_modal_open", { feature });
    }
  }, [open, feature]);

  const handleSubscribe = async () => {
    void trackEvent("pricing_cta_click", { feature, plan: "pro", isAnnual: billingCycle === "annual" });
    try {
      const { url } = await checkout.mutateAsync({
        plan: "pro",
        billingCycle,
      });
      if (url) window.location.href = url;
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Erro ao iniciar checkout");
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-foreground/60 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-[101] w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2",
            "rounded-2xl border border-primary/30 bg-card p-6 shadow-2xl",
            "focus:outline-none",
          )}
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <Dialog.Title className="text-lg font-semibold text-foreground">
                Você atingiu o limite do Free
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                {gate.upgradeCta ??
                  `Desbloqueie ${FEATURE_TITLES[feature]} e muito mais com o plano Pro.`}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted/80"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <ul className="mb-6 space-y-2">
            {PRO_BENEFITS.map((text) => (
              <li key={text} className="flex items-start gap-2 text-sm text-foreground/90">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                {text}
              </li>
            ))}
          </ul>

          <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
            <p className="text-2xl font-bold text-foreground">
              R$ {billingCycle === "annual" ? "290" : "29"}
              <span className="text-sm font-normal text-muted-foreground">
                /{billingCycle === "annual" ? "ano" : "mês"}
              </span>
            </p>
            {billingCycle === "annual" && (
              <p className="mt-1 text-xs text-primary">2 meses grátis no plano anual</p>
            )}
            {billingCycle === "monthly" && (
              <p className="mt-1 text-xs text-muted-foreground">ou R$ 290/ano (economize 2 meses)</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={checkout.isPending}
              onClick={() => void handleSubscribe()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/80 py-3 font-bold text-primary-foreground disabled:opacity-60"
            >
              <Crown className="h-4 w-4" aria-hidden />
              {checkout.isPending ? "Redirecionando…" : "Assinar Pro"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl py-2.5 text-sm text-muted-foreground hover:text-foreground"
            >
              Continuar no Free
            </button>
          </div>

          <p className="mt-4 text-center text-caption text-muted-foreground/70">
            7 dias de garantia. Cancele quando quiser.
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
