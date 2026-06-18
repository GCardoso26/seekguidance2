"use client";

import { useEffect, useState } from "react";
import { loadJudgeHistoryHybrid } from "@/lib/judge-cloud-history";
import { loadJudgeThreads, type JudgeThreads } from "@/lib/judge-thread";
import { parseJudgeSearchParams } from "@/lib/judge-url";
import { getJudgeGames } from "@/services/judgeApi";
import type { JudgeHistoryItem, TcgOption } from "@/types/judge";
import { TCG_OPTIONS } from "@/types/judge";
import type { ReadonlyURLSearchParams } from "next/navigation";

export function useJudgePageInit(
  searchParams: ReadonlyURLSearchParams,
  userId: string | null | undefined,
) {
  const [history, setHistory] = useState<JudgeHistoryItem[]>([]);
  const [threads, setThreads] = useState<JudgeThreads>({});
  const [tcgOptions, setTcgOptions] = useState<TcgOption[]>(TCG_OPTIONS);

  useEffect(() => {
    const parsed = parseJudgeSearchParams(searchParams);
    void loadJudgeHistoryHybrid(userId, parsed.sessionId).then(setHistory);
    setThreads(loadJudgeThreads());

    getJudgeGames()
      .then((games) => {
        if (games.length === 0) return;
        const hasRagReady = games.some((g) => g.rag_ready);
        if (!hasRagReady) {
          /* Corpus vazio ou API degradada — mantém TCG_OPTIONS local (evita todos "Em breve"). */
          return;
        }
        setTcgOptions(
          games.map((g) => ({
            id: g.tcg_id,
            label: g.display_name,
            enabled: g.enabled && g.rag_ready,
            beta: g.beta,
          })),
        );
      })
      .catch(() => {
        /* mantém lista local */
      });
  }, [searchParams, userId]);

  return { history, setHistory, threads, setThreads, tcgOptions };
}
