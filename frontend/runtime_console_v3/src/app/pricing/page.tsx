"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PricingHero } from "@/components/pricing/PricingHero";
import { PricingCard } from "@/components/pricing/PricingCard";
import { FeatureComparisonTable } from "@/components/pricing/FeatureComparisonTable";
import { PricingFAQ } from "@/components/pricing/PricingFAQ";
import { SocialProof } from "@/components/pricing/SocialProof";
import { PRICING_PLANS } from "@/lib/pricing-plans";
import { flushAnalytics, trackEvent } from "@/lib/analytics";
import { useSubscription } from "@/hooks/useSubscription";
import { useAnalytics } from "@/hooks/useAnalytics";

function PricingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromMenu = searchParams.get("from") === "menu";
  const { tier } = useSubscription();
  const { track } = useAnalytics();
  const [isAnnual, setIsAnnual] = useState(false);

  useEffect(() => {
    void trackEvent("pricing_page_view", {
      source: document.referrer || "direct",
    });
    return () => {
      void flushAnalytics();
    };
  }, []);

  return (
    <>
      <PricingHero
        isAnnual={isAnnual}
        onToggle={setIsAnnual}
        onToggleTrack={(annual) => track("pricing_toggle", { isAnnual: annual })}
      />

      {fromMenu && (
        <p className="luxury-page mb-6 text-center text-sm text-primary">
          Seu plano atual:{" "}
          <span className="font-semibold">
            {tier === "free" ? "Jogador Casual" : tier === "pro" ? "Spike" : "Equipe"}
          </span>
        </p>
      )}

      <section className="luxury-page pb-16">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          {PRICING_PLANS.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              isAnnual={isAnnual}
              onCtaClick={(planId, annual) =>
                track("pricing_cta_click", { plan: planId, isAnnual: annual })
              }
            />
          ))}
        </div>
      </section>

      <FeatureComparisonTable isAnnual={isAnnual} />
      <SocialProof />
      <PricingFAQ />

      <section className="luxury-page py-16 text-center">
        <h2 className="mb-4 text-3xl font-light text-foreground">Ainda em dúvida?</h2>
        <p className="mb-8 text-muted-foreground">
          Comece grátis. Upgrade quando sentir que precisa de mais.
        </p>
        <button
          type="button"
          onClick={() => {
            track("pricing_start_free");
            router.push("/judge");
          }}
          className="luxury-btn-primary px-8 py-4 text-base"
        >
          Jogar Grátis
        </button>
      </section>
    </>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="luxury-page py-24 text-center text-muted-foreground">Carregando…</div>
      }
    >
      <PricingContent />
    </Suspense>
  );
}
