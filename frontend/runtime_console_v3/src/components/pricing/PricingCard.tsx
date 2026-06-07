"use client";

import { motion } from "framer-motion";
import { Check, Crown, Users, X, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { useCheckout, useSubscription } from "@/hooks/useSubscription";
import type { BillingCycle, PaidPlanId } from "@/lib/stripe/prices";
import { stripeConfigured } from "@/lib/stripe/prices";
import type { PricingPlan } from "@/lib/pricing-plans";
import { cn } from "@/lib/utils";

const ICONS = {
  zap: Zap,
  crown: Crown,
  users: Users,
} as const;

type Props = {
  plan: PricingPlan;
  isAnnual: boolean;
  onCtaClick?: (planId: string, isAnnual: boolean) => void;
};

export function PricingCard({ plan, isAnnual, onCtaClick }: Props) {
  const router = useRouter();
  const { user } = useJudgeAuth();
  const { tier, isPro } = useSubscription();
  const checkout = useCheckout();
  const Icon = ICONS[plan.iconName];
  const price = isAnnual ? plan.priceAnnual / 12 : plan.priceMonthly;
  const billingPeriod = isAnnual ? "/mês (cobrado anualmente)" : "/mês";
  const billingCycle: BillingCycle = isAnnual ? "annual" : "monthly";
  const isCurrent = tier === plan.id;

  const handleCTA = async () => {
    onCtaClick?.(plan.id, isAnnual);
    if (plan.id === "free") {
      router.push(plan.ctaAction);
      return;
    }

    if (!user) {
      router.push(`/judge?redirect=/pricing`);
      return;
    }

    if (isPro && tier === plan.id) {
      router.push("/settings/billing");
      return;
    }

    if (!stripeConfigured()) {
      if (plan.id === "team") {
        window.location.href = plan.ctaAction;
        return;
      }
      alert("Pagamentos em configuração. Tente novamente em breve.");
      return;
    }

    try {
      const { url } = await checkout.mutateAsync({
        plan: plan.id as PaidPlanId,
        billingCycle,
      });
      if (url) window.location.href = url;
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Erro no checkout");
    }
  };

  return (
    <motion.div
      whileHover={{ y: -8 }}
      id={plan.id === "pro" ? "checkout-pro" : undefined}
      className={cn(
        "relative rounded-2xl border-2 p-8 transition-all duration-300",
        plan.popular
          ? "border-amber-500 bg-slate-800/80 shadow-lg"
          : "border-slate-700 bg-slate-800/50 hover:border-slate-500",
      )}
      style={{ boxShadow: plan.popular ? `0 0 40px ${plan.glowColor}` : undefined }}
    >
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-1 text-sm font-bold text-white">
            MAIS POPULAR
          </span>
        </div>
      )}

      <div className="mb-4 flex items-center gap-3">
        <div style={{ color: plan.color }}>
          <Icon size={24} aria-hidden />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">{plan.name}</h3>
          <p className="text-sm text-slate-400">{plan.subtitle}</p>
        </div>
      </div>

      <div className="mb-6">
        <span className="font-mono text-4xl font-bold text-white">R$ {price.toFixed(2)}</span>
        <span className="text-slate-400">{billingPeriod}</span>
        {isAnnual && plan.priceAnnual > 0 && (
          <p className="mt-1 text-sm text-emerald-400">
            Economia de R$ {(plan.priceMonthly * 12 - plan.priceAnnual).toFixed(2)}/ano
          </p>
        )}
      </div>

      <ul className="mb-8 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature.text} className="flex items-start gap-3">
            {feature.included ? (
              <Check size={18} className="mt-0.5 shrink-0 text-emerald-400" aria-hidden />
            ) : (
              <X size={18} className="mt-0.5 shrink-0 text-slate-600" aria-hidden />
            )}
            <span
              className={cn(
                "text-sm",
                feature.included
                  ? feature.highlight
                    ? "font-medium text-white"
                    : "text-slate-300"
                  : "text-slate-500",
              )}
            >
              {feature.text}
            </span>
          </li>
        ))}
      </ul>

      {isCurrent && (
        <span className="mb-3 inline-block rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300">
          Plano atual
        </span>
      )}

      <button
        type="button"
        onClick={() => void handleCTA()}
        disabled={checkout.isPending || (isCurrent && plan.id !== "free")}
        className={cn(
          "w-full rounded-xl py-3 font-bold transition-all disabled:opacity-60",
          plan.popular
            ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-400 hover:to-orange-500"
            : "bg-slate-700 text-white hover:bg-slate-600",
        )}
      >
        {checkout.isPending
          ? "A redirecionar..."
          : isCurrent && plan.id !== "free"
            ? "Plano ativo"
            : isPro && tier === plan.id
              ? "Gerir subscrição"
              : plan.cta}
      </button>
    </motion.div>
  );
}
