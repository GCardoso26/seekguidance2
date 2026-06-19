"use client";

import type { ReactNode } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { useUpgradeModal } from "@/components/premium/UpgradeModalProvider";
import type { SubscriptionFeatures } from "@/lib/subscription/features";
import { trackEvent } from "@/lib/analytics";

const FEATURE_TO_GATE: Partial<Record<keyof SubscriptionFeatures, "export" | "torneios">> = {
  deck_export: "export",
  tournament_creation: "torneios",
  advanced_analytics: "export",
};

type Props = {
  feature: keyof SubscriptionFeatures;
  children: ReactNode;
  fallback?: ReactNode;
};

export function FeatureGate({ feature, children, fallback }: Props) {
  const { features, isLoading } = useSubscription();
  const { showUpgrade } = useUpgradeModal();

  if (isLoading) {
    return <p className="text-sm text-slate-400">A verificar plano...</p>;
  }

  if (!features[feature]) {
    const gateFeature = FEATURE_TO_GATE[feature] ?? "export";
    return (
      fallback ?? (
        <div className="rounded-xl border border-[#2d2d44] bg-slate-900/80 p-8 text-center">
          <p className="mb-4 text-slate-400">Esta funcionalidade requer o plano Pro.</p>
          <button
            type="button"
            className="text-emerald-400 hover:underline"
            onClick={() => {
              void trackEvent("paywall_hit", { feature });
              showUpgrade(gateFeature);
            }}
          >
            Fazer upgrade →
          </button>
        </div>
      )
    );
  }

  return <>{children}</>;
}
