"use client";

import Link from "next/link";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TournamentCreateForm } from "@/components/tournament/TournamentCreateForm";
import { JudgeLogo } from "@/components/judge/JudgeLogo";

const queryClient = new QueryClient();

export default function TournamentCreatePage() {
  return (
    <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-luxury-frost">
          <header className="border-b border-white/10 px-4 py-4">
            <div className="container mx-auto flex items-center gap-3">
              <Link href="/dashboard" className="flex items-center gap-3">
                <JudgeLogo size={32} />
                <span className="font-bold">Judge TCG</span>
              </Link>
            </div>
          </header>
          <main className="container mx-auto max-w-2xl px-4 py-10">
            <h1 className="mb-2 text-3xl font-bold text-white">Criar Novo Torneio</h1>
            <p className="mb-8 text-luxury-mist">
              Escolhe o jogo e configura o formato. O sistema adapta regras de decklist e timer automaticamente.
            </p>
            <TournamentCreateForm />
          </main>
        </div>
    </QueryClientProvider>
  );
}
