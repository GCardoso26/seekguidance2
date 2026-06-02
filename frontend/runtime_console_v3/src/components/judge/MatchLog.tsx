"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  formatRoundTime,
  getRoundById,
  listRoundsForTcg,
  type MatchRound,
} from "@/lib/match-log";
import type { JudgeHistoryItem, TcgType } from "@/types/judge";
import { cn } from "@/lib/utils";

type Props = {
  tcg: TcgType;
  items: JudgeHistoryItem[];
  onSelect?: (item: JudgeHistoryItem) => void;
  onClear?: () => void;
};

export function MatchLog({ tcg, items, onSelect, onClear }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roundId = searchParams.get("round");
  const [rounds, setRounds] = useState<MatchRound[]>([]);

  const refreshRounds = useCallback(() => {
    setRounds(listRoundsForTcg(tcg));
  }, [tcg]);

  useEffect(() => {
    refreshRounds();
  }, [refreshRounds, items.length]);

  const activeRound = roundId ? getRoundById(roundId) : undefined;

  const handleRoundClick = (round: MatchRound) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("round", round.id);
    params.set("game", round.tcg);
    router.replace(`/judge?${params.toString()}`, { scroll: false });

    const first = round.questions[0];
    if (first && onSelect) {
      const item = items.find((i) => i.id === first.historyId);
      if (item) onSelect(item);
    }
  };

  const roundsToShow = useMemo(() => {
    if (rounds.length > 0) return rounds;
    if (items.length === 0) return [];
    return [
      {
        id: "legacy",
        tcg,
        gameSlug: tcg,
        startedAt: items[0]?.createdAt ?? new Date().toISOString(),
        questions: items.slice(0, 8).map((i) => ({
          historyId: i.id,
          question: i.question,
          createdAt: i.createdAt,
        })),
      } satisfies MatchRound,
    ];
  }, [rounds, items, tcg]);

  if (items.length === 0 && roundsToShow.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--tcg-border)] p-4 text-center text-sm text-[var(--tcg-text-secondary)]">
        Nenhuma rodada nesta partida ainda.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden>
            📋
          </span>
        <p className="text-sm font-bold uppercase tracking-wide text-[var(--tcg-text-primary)]">
          Log da partida
        </p>
        </div>
        {onClear && items.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-semibold text-[var(--tcg-primary-light)] hover:underline"
          >
            Limpar
          </button>
        )}
      </div>

      <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
        {roundsToShow.map((round, idx) => (
          <button
            key={round.id}
            type="button"
            onClick={() => handleRoundClick(round)}
            className={cn(
              "judge-match-round w-full rounded-xl border p-3 text-left transition hover:brightness-110",
              roundId === round.id && "ring-2 ring-[var(--tcg-primary-light)]",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-[var(--tcg-text-secondary)]">
                Rodada {roundsToShow.length - idx} · {formatRoundTime(round.startedAt)}
              </span>
              {roundId === round.id && (
                <span
                  className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-[var(--tcg-accent)]"
                  aria-label="Rodada ativa"
                />
              )}
            </div>
            <ul className="mt-2 space-y-1">
              {round.questions.slice(0, 4).map((q) => (
                <li key={q.historyId} className="truncate text-sm text-[var(--tcg-text-secondary)]">
                  · {q.question}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      {activeRound && (
        <p className="text-[10px] text-[var(--tcg-text-secondary)]">
          Rodada ativa: {activeRound.questions.length} pergunta(s)
        </p>
      )}
    </div>
  );
}
