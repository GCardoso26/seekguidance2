"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GameMatSelectorCompact } from "@/components/landing/GameMatSelectorCompact";
import { FeatureCard } from "@/components/landing/FeatureCard";
import { AuthProvider, useJudgeAuth } from "@/features/auth/AuthProvider";
import { GoogleLoginButton } from "@/features/auth/GoogleLoginButton";
import { JudgeLogo } from "@/components/judge/JudgeLogo";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/hooks/useAnalytics";
import type { PricingCtaLocation } from "@/lib/analytics";
import type { TcgType } from "@/types/judge";
import { useState } from "react";

function LandingContent() {
  const router = useRouter();
  const { user } = useJudgeAuth();
  const { track } = useAnalytics();
  const [previewTcg] = useState<TcgType>("magic");

  const trackPricingCta = (location: PricingCtaLocation) => {
    track("pricing_cta_click", {
      location,
      user_intent: "explore_pricing",
    });
  };

  const handleConsultar = () => {
    if (user) {
      router.push("/judge");
      return;
    }
    document.getElementById("login-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-800/60 bg-slate-900/85 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <JudgeLogo size={36} />
            <span className="text-lg font-bold">Judge TCG</span>
          </Link>

          <nav className="hidden items-center gap-6 sm:flex">
            <a
              href="#como-funciona"
              className="text-sm font-medium text-slate-400 transition-colors hover:text-white"
            >
              Como funciona
            </a>
            <Link
              href="/pricing"
              onClick={() => trackPricingCta("header")}
              className="text-sm font-medium text-slate-400 transition-colors hover:text-amber-400"
            >
              Preços
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/pricing"
              onClick={() => trackPricingCta("header")}
              className="text-sm font-medium text-amber-400 transition-colors hover:text-amber-300 sm:hidden"
            >
              Preços
            </Link>
            {user ? (
              <Link
                href="/judge"
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400"
              >
                Ir para a mesa
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleConsultar}
                className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400 sm:px-4"
              >
                Jogar Grátis →
              </button>
            )}
          </div>
        </div>
      </header>

      <section className="container mx-auto px-4 py-16 text-center md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="mb-6 text-4xl font-bold text-white md:text-6xl">
            Judge <span className="text-amber-400">TCG</span>
          </h1>
          <p className="mx-auto mb-3 max-w-2xl text-xl text-slate-300 md:text-2xl">
            Não sabe se pode fazer aquela jogada?
          </p>
          <p className="mx-auto mb-10 max-w-xl text-lg text-slate-400">
            Pergunte ao juiz virtual. Receba o veredito em segundos, com base nas regras oficiais do seu
            jogo.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <button
              type="button"
              onClick={handleConsultar}
              className="rounded-xl bg-emerald-500 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:scale-[1.02] hover:bg-emerald-400"
            >
              🎮 Jogar Grátis
            </button>
            <Link href="/pricing" onClick={() => trackPricingCta("hero_secondary")}>
              <Button
                variant="outline"
                className="h-auto border-amber-500/30 px-8 py-4 text-lg font-bold text-amber-400 hover:bg-amber-500/10"
              >
                💎 Ver Preços
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-slate-500">Sem cartão de crédito</p>
        </motion.div>
      </section>

      <section id="como-funciona" className="container mx-auto scroll-mt-24 px-4 py-12">
        <h2 className="mb-10 text-center text-3xl font-bold text-white">Como funciona</h2>
        <div className="grid gap-8 md:grid-cols-3">
          <FeatureCard
            icon="🎮"
            title="Escolha seu jogo"
            description="Magic, Pokémon, Yu-Gi-Oh! e mais. Selecione o TCG que está jogando."
          />
          <FeatureCard
            icon="🧠"
            title="Faça sua pergunta"
            description='Ex.: "Posso ativar essa habilidade?" Pergunte em português.'
          />
          <FeatureCard
            icon="⚖️"
            title="Receba o veredito"
            description="Permitido, não permitido ou depende — com explicação e fonte oficial."
          />
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 text-center">
        <h2 className="mb-3 text-2xl font-bold text-white md:text-3xl">💰 Quanto custa competir?</h2>
        <p className="mx-auto mb-8 max-w-lg text-slate-400">
          Escolha o seu plano e entre na liga. Comece grátis ou vá direto ao Spike.
        </p>
        <Link href="/pricing" onClick={() => trackPricingCta("mid_page")}>
          <Button className="h-auto bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-4 text-base font-bold text-white hover:from-emerald-400 hover:to-emerald-500">
            Ver Planos e Preços →
          </Button>
        </Link>
      </section>

      <section className="container mx-auto px-4 py-12">
        <h2 className="mb-8 text-center text-3xl font-bold text-white">Jogos suportados</h2>
        <div className="mx-auto max-w-4xl rounded-2xl border border-slate-700/60 bg-slate-900/50 p-6">
          <GameMatSelectorCompact
            value={previewTcg}
            onChange={() => {}}
            disabled
            showHeader={false}
          />
        </div>
        <p className="mt-6 text-center text-slate-400">
          Mais de 10.000 regras oficiais indexadas e atualizadas.
        </p>
      </section>

      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="mb-3 text-2xl font-bold text-white md:text-3xl">Pronto para subir de nível?</h2>
        <p className="mx-auto mb-8 max-w-md text-slate-400">
          Compare planos ou comece grátis agora — você decide o ritmo.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link href="/pricing" onClick={() => trackPricingCta("final_cta")}>
            <Button
              variant="outline"
              className="h-auto border-amber-500/40 px-8 py-3 font-semibold text-amber-400 hover:bg-amber-500/10"
            >
              Ver Preços
            </Button>
          </Link>
          <button
            type="button"
            onClick={handleConsultar}
            className="rounded-xl bg-emerald-500 px-8 py-3 font-bold text-white transition hover:bg-emerald-400"
          >
            Jogar Grátis →
          </button>
        </div>
      </section>

      <section id="login-section" className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-md rounded-2xl border border-slate-700 bg-slate-800/50 p-8">
          <h2 className="mb-2 text-center text-2xl font-bold text-white">Comece a consultar</h2>
          <p className="mb-6 text-center text-slate-400">
            Entre com sua conta Google. Sem senhas, sem complicação.
          </p>
          <GoogleLoginButton redirectTo="/judge" />
          <p className="mt-4 text-center text-xs text-slate-500">
            Já usou antes? Suas perguntas ficam salvas na sua conta.
          </p>
          <p className="mt-4 text-center text-xs text-slate-500">
            Ao entrar, você aceita nossos{" "}
            <Link href="/privacidade" className="text-amber-400 hover:underline">
              Termos de Privacidade
            </Link>
            .
          </p>
        </div>
      </section>

      <footer className="container mx-auto border-t border-slate-800 px-4 py-8 text-center text-sm text-slate-500">
        <p>© 2026 Judge TCG. Não afiliado às empresas dos jogos.</p>
        <p className="mt-2">
          <Link href="/privacidade" className="hover:text-slate-300">
            Privacidade
          </Link>
          {" · "}
          <Link
            href="/pricing"
            onClick={() => trackPricingCta("footer")}
            className="hover:text-slate-300"
          >
            Preços
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

export default function LandingPage() {
  return (
    <AuthProvider>
      <LandingContent />
    </AuthProvider>
  );
}
