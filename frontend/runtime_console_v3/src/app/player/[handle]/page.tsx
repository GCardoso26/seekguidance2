"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PlayerProfile } from "@/components/player/PlayerProfile";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";

const qc = new QueryClient();

function ProfilePage() {
  const params = useParams();
  const handle = String(params.handle ?? "");
  const { data, isLoading, isError } = usePlayerProfile(handle);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-800 px-4 py-4">
        <div className="container mx-auto flex items-center gap-4">
          <Link href="/" className="text-sm text-slate-400 hover:text-white">
            ← Início
          </Link>
          <Link href="/search" className="text-sm text-slate-400 hover:text-white">
            Descobrir torneios
          </Link>
        </div>
      </header>
      <main className="container mx-auto max-w-3xl px-4 py-8">
        {isLoading && <p className="text-slate-400">Carregando perfil…</p>}
        {isError && <p className="text-red-400">Jogador não encontrado.</p>}
        {data && <PlayerProfile profile={data} showFriendButton />}
      </main>
    </div>
  );
}

export default function Page() {
  return (
    <QueryClientProvider client={qc}>
      <ProfilePage />
    </QueryClientProvider>
  );
}
