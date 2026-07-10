"use client";

import Link from "next/link";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useCreateLeague } from "@/hooks/useLeague";

const qc = new QueryClient();

function addWeeks(d: Date, weeks: number) {
  const n = new Date(d);
  n.setDate(n.getDate() + weeks * 7);
  return n.toISOString();
}

function CreateLeagueWizard() {
  const router = useRouter();
  const create = useCreateLeague();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [game, setGame] = useState("MTG");
  const [format, setFormat] = useState("STANDARD");
  const [events, setEvents] = useState<Array<Record<string, unknown>>>([]);

  const generate12Weeks = () => {
    const now = new Date();
    setEvents(
      Array.from({ length: 12 }, (_, i) => ({
        name: `Semana ${i + 1}`,
        event_date: addWeeks(now, i),
        points_multiplier: i < 4 ? 1.0 : i < 8 ? 1.5 : i < 11 ? 2.0 : 3.0,
        week_number: i + 1,
      })),
    );
  };

  const handleCreate = () => {
    create.mutate(
      {
        name,
        game_code: game,
        format_code: format,
        events,
        prize_structure: { description: "Prêmios definidos pelo organizador" },
      },
      {
        onSuccess: (data) => {
          const id = data?.id;
          if (id) router.push(`/leagues/${id}`);
        },
      },
    );
  };

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Link href="/leagues" className="text-sm text-muted-foreground">
          ← Ligas
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Criar nova liga</h1>

        {step === 1 && (
          <div className="mt-6 space-y-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome da liga"
              className="w-full min-h-[44px] surface-card rounded-lg px-4"
            />
            <select value={game} onChange={(e) => setGame(e.target.value)} className="w-full surface-card rounded-lg px-4 py-3">
              {["MTG", "POKEMON", "LORCANA", "SWU"].map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <input
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              placeholder="Formato"
              className="w-full min-h-[44px] surface-card rounded-lg px-4"
            />
            <button type="button" onClick={() => setStep(2)} className="rounded-lg bg-primary px-6 py-2 font-semibold text-primary-foreground">
              Continuar
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold">Calendário</h2>
            <button type="button" onClick={generate12Weeks} className="mt-3 rounded-lg border border-border px-4 py-2 text-sm">
              Gerar 12 semanas automáticas
            </button>
            <ul className="mt-4 space-y-2">
              {events.map((ev, i) => (
                <li key={i} className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
                  {String(ev.name)} · ×{String(ev.points_multiplier)}
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => setStep(3)} className="mt-4 rounded-lg bg-primary px-6 py-2 font-semibold text-primary-foreground">
              Continuar
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold">Confirmar</h2>
            <p className="mt-2 text-foreground/90">
              {name} — {game} {format} · {events.length} eventos
            </p>
            <button
              type="button"
              onClick={handleCreate}
              disabled={create.isPending || !name || events.length === 0}
              className="mt-4 rounded-lg bg-primary px-6 py-2 font-semibold text-primary-foreground disabled:opacity-50"
            >
              {create.isPending ? "Criando…" : "Criar liga"}
            </button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}

export default function Page() {
  return (
    <QueryClientProvider client={qc}>
      <CreateLeagueWizard />
    </QueryClientProvider>
  );
}
