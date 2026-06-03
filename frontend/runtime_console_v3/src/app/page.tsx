"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { GameMatSelectorCompact } from "@/components/landing/GameMatSelectorCompact";
import { FeatureCard } from "@/components/landing/FeatureCard";
import { AuthProvider, useJudgeAuth } from "@/features/auth/AuthProvider";
import { GoogleLoginButton } from "@/features/auth/GoogleLoginButton";
import { JudgeLogo } from "@/components/judge/JudgeLogo";
import type { TcgType } from "@/types/judge";
import { useState } from "react";

function LandingContent() {
  const router = useRouter();
  const { user } = useJudgeAuth();
  const [previewTcg] = useState<TcgType>("magic");

  const handleConsultar = () => {
    if (user) {
      router.push("/judge");
      return;
    }
    document.getElementById("login-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-slate-100">
      <header className="container mx-auto flex items-center justify-between px-4 py-6">
        <div className="flex items-center gap-3">
          <JudgeLogo size={36} />
          <span className="text-lg font-bold">Judge TCG</span>
        </div>
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
            className="text-sm text-amber-400 hover:underline"
          >
            Entrar
          </button>
        )}
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
          <button
            type="button"
            onClick={handleConsultar}
            className="rounded-xl bg-amber-500 px-8 py-4 text-lg font-bold text-slate-900 shadow-lg shadow-amber-500/25 transition hover:scale-[1.02] hover:bg-amber-400"
          >
            Consultar Regras
          </button>
        </motion.div>
      </section>

      <section className="container mx-auto px-4 py-12">
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
          <Link href="/pricing" className="hover:text-slate-300">
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
