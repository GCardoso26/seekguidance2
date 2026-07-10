"use client";

import { useEffect, useState } from "react";
import { NotificationPermissionPrompt } from "@/components/notifications/PermissionPrompt";
import { GameSelector } from "@/components/tournament/GameSelector";
import type { GameCode } from "@/lib/tcg-adapters";

const STORAGE_KEY = "tcg-judge-onboarding-step";

const STEPS = [
  { title: "Bem-vindo ao Judge TCG!", description: "A plataforma completa para torneios de TCG." },
  { title: "Crie seu perfil", description: "Escolha um handle único na página de perfil." },
  { title: "Escolha seus jogos", description: "Selecione os TCGs que você joga." },
  { title: "Ative notificações", description: "Receba alertas de torneios e rodadas." },
  { title: "Pronto!", description: "Explore torneios ou crie o seu primeiro." },
];

export function OnboardingFlow() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [game, setGame] = useState<GameCode | null>("MTG");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "done") setDone(true);
    else if (saved) setStep(Number(saved) || 0);
  }, []);

  if (done) return null;

  const current = STEPS[step];

  const next = () => {
    if (step >= STEPS.length - 1) {
      localStorage.setItem(STORAGE_KEY, "done");
      setDone(true);
      return;
    }
    const n = step + 1;
    setStep(n);
    localStorage.setItem(STORAGE_KEY, String(n));
  };

  return (
    <div className="mx-auto mb-6 max-w-lg rounded-xl border border-amber-500/30 bg-slate-800/80 p-6">
      <p className="text-xs text-warning">
        Passo {step + 1}/{STEPS.length}
      </p>
      <h2 className="mt-1 text-xl font-bold">{current.title}</h2>
      <p className="mt-2 text-sm text-slate-300">{current.description}</p>

      {step === 2 && (
        <div className="mt-4">
          <GameSelector value={game} onChange={setGame} />
        </div>
      )}
      {step === 3 && (
        <div className="mt-4">
          <NotificationPermissionPrompt />
        </div>
      )}

      <button
        type="button"
        data-testid="onboarding-continue"
        onClick={next}
        className="mt-4 min-h-[44px] rounded-lg bg-amber-500 px-6 py-2 font-semibold text-slate-900"
      >
        {step >= STEPS.length - 1 ? "Começar" : "Continuar"}
      </button>
    </div>
  );
}
