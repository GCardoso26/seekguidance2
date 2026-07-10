"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TCGOnboardingGrid } from "@/components/onboarding/TCGOnboardingGrid";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { useOnboarding } from "@/hooks/useOnboarding";
import type { TcgType } from "@/types/judge";

export function OnboardingPageClient() {
  const router = useRouter();
  const { user, loading: authLoading } = useJudgeAuth();
  const { needsOnboarding, isLoading: onboardingLoading } = useOnboarding();
  const [selected, setSelected] = useState<TcgType[]>([]);

  useEffect(() => {
    if (authLoading || onboardingLoading) return;
    if (!user || !needsOnboarding) router.replace("/judge");
  }, [authLoading, onboardingLoading, user, needsOnboarding, router]);

  if (authLoading || onboardingLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        Carregando...
      </div>
    );
  }

  if (!user || !needsOnboarding) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        Redirecionando...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-16 lg:px-8">
      <header className="mb-12 text-center">
        <p className="mb-3 text-xs tracking-[0.3em] text-primary uppercase">Primeiro acesso</p>
        <h1 className="mb-4 text-foreground">Bem-vindo à Mesa. Escolha seus 5 jogos.</h1>
        <p className="mx-auto max-w-xl text-muted-foreground">
          No plano Free você consulta rulings nos TCGs que escolher agora. Os demais desbloqueiam
          com o plano Pro.
        </p>
      </header>
      <TCGOnboardingGrid selected={selected} onChange={setSelected} />
    </div>
  );
}
