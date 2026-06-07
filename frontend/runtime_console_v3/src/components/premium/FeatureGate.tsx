"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import type { SubscriptionFeatures } from "@/lib/subscription/features";
import { trackEvent } from "@/lib/analytics";

type Props = {
  feature: keyof SubscriptionFeatures;
  children: ReactNode;
  fallback?: ReactNode;
};

export function FeatureGate({ feature, children, fallback }: Props) {
  const { features, isLoading } = useSubscription();

  if (isLoading) {
    return <p className="text-sm text-slate-400">A verificar plano...</p>;
  }

  if (!features[feature]) {
    return (
      fallback ?? (
        <div className="rounded-xl border border-[#2d2d44] bg-slate-900/80 p-8 text-center">
          <p className="mb-4 text-slate-400">Esta funcionalidade requer um plano Spike ou Equipe.</p>
          <Link
            href="/pricing"
            className="text-emerald-400 hover:underline"
            onClick={() => void trackEvent("paywall_hit", { feature })}
          >
            Fazer upgrade →
          </Link>
        </div>
      )
    );
  }

  return <>{children}</>;
}
