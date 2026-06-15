"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PlayerProfile } from "@/components/player/PlayerProfile";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";

const qc = new QueryClient();

function ProfilePage() {
  const params = useParams();
  const handle = String(params.handle ?? "");
  const { data, isLoading, isError } = usePlayerProfile(handle);

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/" className="text-sm text-luxury-mist hover:text-luxury-frost">
            ← Início
          </Link>
          <Link href="/search" className="text-sm text-luxury-mist hover:text-luxury-frost">
            Descobrir torneios
          </Link>
        </div>
        {isLoading && <p className="text-luxury-mist">Carregando perfil…</p>}
        {isError && <p className="text-red-400">Jogador não encontrado.</p>}
        {data && <PlayerProfile profile={data} showFriendButton />}
      </div>
    </MobileLayout>
  );
}

export default function Page() {
  return (
    <QueryClientProvider client={qc}>
      <ProfilePage />
    </QueryClientProvider>
  );
}
