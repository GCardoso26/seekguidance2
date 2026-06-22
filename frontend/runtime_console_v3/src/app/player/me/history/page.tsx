"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConsultationHistoryList } from "@/components/player/ConsultationHistoryList";
import { MobileLayout } from "@/components/layout/MobileLayout";
import type { JudgeHistoryItem } from "@/types/judge";

export default function PlayerHistoryPage() {
  const router = useRouter();

  function handleSelect(item: JudgeHistoryItem) {
    const params = new URLSearchParams({ game: item.tcg, q: item.question });
    router.push(`/judge?${params.toString()}`);
  }

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Link href="/perfil" className="text-sm text-luxury-mist">
          ← Meu perfil
        </Link>
        <h1 className="mt-2 text-3xl font-bold">Histórico de consultas</h1>
        <p className="mt-1 text-luxury-mist">Busque, filtre e favorite suas perguntas ao juiz.</p>

        <div className="mt-6">
          <ConsultationHistoryList onSelect={handleSelect} />
        </div>
      </div>
    </MobileLayout>
  );
}
