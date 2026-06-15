"use client";

import { Suspense } from "react";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PricingHero } from "@/components/pricing/PricingHero";
import { PricingCard } from "@/components/pricing/PricingCard";
import { FeatureComparisonTable } from "@/components/pricing/FeatureComparisonTable";
import { PricingFAQ } from "@/components/pricing/PricingFAQ";
import { SocialProof } from "@/components/pricing/SocialProof";
import { JudgeLogo } from "@/components/judge/JudgeLogo";
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
    <div className="min-h-screen bg-[#0a0a0f] text-[#e2e8f0]">
      <header className="container mx-auto flex items-center justify-between px-4 py-6">
        <Link href="/" className="flex items-center gap-3">
          <JudgeLogo size={36} />
          <span className="text-lg font-bold text-white">Judge TCG</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/judge" className="text-slate-400 hover:text-white">
            Mesa
          </Link>
          <Link href="/" className="text-amber-400 hover:underline">
            Início
          </Link>
        </nav>
      </header>

      <PricingHero
        isAnnual={isAnnual}
        onToggle={setIsAnnual}
        onToggleTrack={(annual) => track("pricing_toggle", { isAnnual: annual })}
      />

      {fromMenu && (
        <p className="container mx-auto mb-6 px-4 text-center text-sm text-amber-300">
          Seu plano atual:{" "}
          <span className="font-semibold">
            {tier === "free" ? "Jogador Casual" : tier === "pro" ? "Spike" : "Equipe"}
          </span>
        </p>
      )}

      <section className="container mx-auto px-4 pb-16">
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

      <section className="py-20 text-center">
        <h2 className="mb-4 text-3xl font-bold text-white">Ainda em dúvida?</h2>
        <p className="mb-8 text-slate-400">
          Comece grátis. Upgrade quando sentir que precisa de mais.
        </p>
        <button
          type="button"
          onClick={() => {
            track("pricing_start_free");
            router.push("/judge");
          }}
          className="rounded-xl bg-emerald-500 px-8 py-4 font-bold text-white transition hover:bg-emerald-400"
        >
          Jogar Grátis →
        </button>
      </section>

      <footer className="container mx-auto border-t border-[#2d2d44] px-4 py-8 text-center text-sm text-slate-500">
        <p>© 2026 Judge TCG. Não afiliado às empresas dos jogos.</p>
        <p className="mt-2">
          <Link href="/privacidade" className="hover:text-slate-300">
            Privacidade
          </Link>
          {" · "}
          <Link href="/judge" className="hover:text-slate-300">
            Mesa de regras
          </Link>
        </p>
      </footer>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f] p-8 text-center text-slate-400">Carregando…</div>}>
      <PricingContent />
    </Suspense>
  );
}
