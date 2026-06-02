"use client";



import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { AskButton } from "@/components/judge/AskButton";


import { EmptyTableState } from "@/components/judge/EmptyTableState";
import { ErrorCardState } from "@/components/judge/ErrorCardState";
import { JudgeToast } from "@/components/judge/JudgeToast";

import { GameMatSelector } from "@/components/judge/GameMatSelector";

import { GameTableLayout } from "@/components/judge/GameTableLayout";

import { JudgeLayout } from "@/components/judge/JudgeLayout";

import { JudgeThread } from "@/components/judge/JudgeThread";

import { MatchLog } from "@/components/judge/MatchLog";

import { QuestionInput } from "@/components/judge/QuestionInput";

import { RuleSourcesPanel } from "@/components/judge/RuleSourcesPanel";

import { useJudgeAuth } from "@/features/auth/AuthProvider";

import { loadJudgeHistoryHybrid, persistJudgeHistoryItem } from "@/lib/judge-cloud-history";

import { clearJudgeHistory } from "@/lib/judge-history";

import {

  buildThreadContext,

  clearThreadForTcg,

  getThreadForTcg,

  loadJudgeThreads,

  updateThreadTurn,

  upsertThreadTurn,

  type JudgeThreadTurn,

  type JudgeThreads,

} from "@/lib/judge-thread";

import { appendQuestionToRound, ensureActiveRound, getRoundById } from "@/lib/match-log";
import { buildJudgeUrlParams, isValidTcgType, parseJudgeSearchParams } from "@/lib/judge-url";
import { hapticFeedback } from "@/utils/haptic";

import { extractHighlightTerms, parseJudgeVerdict } from "@/lib/judge-verdict";

import { getTcgBrand } from "@/lib/tcg-brand";

import { fetchJudgeShare } from "@/services/judgeShareApi";

import { askJudgeQuestionPreferStream, getJudgeGames, getJudgeHealth, judgeErrorMessage } from "@/services/judgeApi";

import { recordGrowthEvent } from "@/services/judgeGrowthApi";

import type { BackendHealthState, JudgeHistoryItem, JudgeResponse, TcgOption, TcgType } from "@/types/judge";

import { TCG_OPTIONS } from "@/types/judge";



const RESPONSE_PANEL_ID = "judge-response-panel";



export function JudgePageClient() {

  const router = useRouter();

  const searchParams = useSearchParams();

  const { user } = useJudgeAuth();

  const [tcg, setTcg] = useState<TcgType>("magic");

  const [question, setQuestion] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [history, setHistory] = useState<JudgeHistoryItem[]>([]);

  const [historyByTurnId, setHistoryByTurnId] = useState<Record<string, JudgeHistoryItem>>({});

  const [threads, setThreads] = useState<JudgeThreads>({});

  const [health, setHealth] = useState<BackendHealthState>("offline");

  const [tcgOptions, setTcgOptions] = useState<TcgOption[]>(TCG_OPTIONS);

  const bottomRef = useRef<HTMLDivElement>(null);

  const autoSubmitDone = useRef(false);

  const deepLinkDone = useRef(false);

  const tcgBrand = getTcgBrand(tcg);

  const currentTurns = getThreadForTcg(threads, tcg);

  const activeLoading = currentTurns.some((t) => t.loading);



  const syncUrl = useCallback(

    (nextTcg: TcgType, q?: string, extra?: Record<string, string>) => {

      const params = buildJudgeUrlParams(nextTcg, q);

      if (extra) {

        Object.entries(extra).forEach(([k, v]) => params.set(k, v));

      }

      router.replace(`/judge?${params.toString()}`, { scroll: false });

    },

    [router],

  );



  const scrollToBottom = useCallback(() => {

    bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  }, []);



  useEffect(() => {

    const parsed = parseJudgeSearchParams(searchParams);

    void (async () => {

      const items = await loadJudgeHistoryHybrid(user?.id, parsed.sessionId);

      setHistory(items);

    })();

    setThreads(loadJudgeThreads());

    getJudgeHealth().then(setHealth);

    getJudgeGames()

      .then((games) => {

        if (games.length === 0) return;

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

    const t = setInterval(() => getJudgeHealth().then(setHealth), 30_000);

    return () => clearInterval(t);

  }, [searchParams, user?.id]);



  useEffect(() => {
    const parsed = parseJudgeSearchParams(searchParams);
    if (parsed.tcg) setTcg(parsed.tcg);
    if (parsed.question) setQuestion(parsed.question);
    if (parsed.roundId) {
      const round = getRoundById(parsed.roundId);
      const firstId = round?.questions[0]?.historyId;
      if (firstId) {
        void loadJudgeHistoryHybrid(user?.id).then((items) => {
          const hit = items.find((i) => i.id === firstId);
          if (hit) loadFromHistory(hit);
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deep link round
  }, [searchParams]);



  useEffect(() => {

    if (deepLinkDone.current) return;

    const parsed = parseJudgeSearchParams(searchParams);

    if (!parsed.shareId) return;

    deepLinkDone.current = true;



    void (async () => {

      const share = await fetchJudgeShare(parsed.shareId!, parsed.shareSig);

      if (!share) return;

      const shareTcg = isValidTcgType(share.tcg) ? share.tcg : tcg;

      setTcg(shareTcg);

      setQuestion(share.question);

      const restored: JudgeThreadTurn = {

        id: `share-${share.id}`,

        question: share.question,

        response: share.response,

        createdAt: new Date().toISOString(),

      };

      setThreads((prev) => upsertThreadTurn(prev, shareTcg, restored));

      void recordGrowthEvent({

        metric_type: "share_opened",

        game: share.tcg,

        details: { share_id: share.id },

      });

      setTimeout(scrollToBottom, 100);

    })();

  }, [searchParams, scrollToBottom, tcg]);



  const runQuestion = useCallback(

    async (q: string, game: TcgType) => {

      if (!q.trim() || submitting) return;



      const turnId = `${Date.now()}`;

      let conversationContext: string | undefined;



      const loadingTurn: JudgeThreadTurn = {

        id: turnId,

        question: q.trim(),

        response: null,

        streamingText: "",

        loading: true,

        error: null,

        createdAt: new Date().toISOString(),

      };



      setThreads((prev) => {

        conversationContext = buildThreadContext(getThreadForTcg(prev, game));

        return upsertThreadTurn(prev, game, loadingTurn);

      });



      setSubmitting(true);

      setError(null);

      setQuestion("");

      syncUrl(game, q.trim());



      try {

        const res = await askJudgeQuestionPreferStream(

          { tcg: game, question: q.trim(), context: conversationContext },

          {

            onPhase: (phase) => {

              setThreads((prev) =>

                updateThreadTurn(prev, game, turnId, {

                  streamingPhase: phase.label,

                }),

              );

            },

            onToken: (text) => {

              setThreads((prev) => {

                const turns = getThreadForTcg(prev, game);

                const current = turns.find((t) => t.id === turnId);

                if (!current) return prev;

                return updateThreadTurn(prev, game, turnId, {

                  streamingText: `${current.streamingText ?? ""}${text}`,

                  streamingPhase: null,

                });

              });

            },

            onDone: (response) => {

              setThreads((prev) =>

                updateThreadTurn(prev, game, turnId, {

                  response,

                  loading: false,

                  streamingText: undefined,

                  streamingPhase: null,

                }),

              );

            },

          },

        );



        const item: JudgeHistoryItem = {

          id: turnId,

          tcg: game,

          question: q.trim(),

          answer: res.answer,

          success: res.success,

          confidence: res.confidence,

          sources: res.sources ?? [],

          runtime_confidence: res.runtime_confidence,

          verdict: res.verdict,

          rule_applied: res.rule_applied,

          explanation: res.explanation,

          exceptions: res.exceptions,

          confidence_notice_threshold: res.confidence_notice_threshold,

          createdAt: new Date().toISOString(),

        };

        const nextHistory = await persistJudgeHistoryItem(item, user?.id);

        appendQuestionToRound(game, { ...item, id: turnId, createdAt: item.createdAt });
        hapticFeedback("medium");

        setHistory(nextHistory);

        setHistoryByTurnId((prev) => ({ ...prev, [turnId]: item }));

        setTimeout(scrollToBottom, 120);

      } catch (e) {

        const message = judgeErrorMessage(e);

        setError(message);

        setThreads((prev) =>

          updateThreadTurn(prev, game, turnId, {

            loading: false,

            error: message,

          }),

        );

      } finally {

        setSubmitting(false);

      }

    },

    [submitting, syncUrl, scrollToBottom, user?.id],

  );



  useEffect(() => {

    if (autoSubmitDone.current) return;

    const parsed = parseJudgeSearchParams(searchParams);

    if (parsed.sessionId || parsed.shareId) return;

    if (!parsed.question?.trim()) return;

    autoSubmitDone.current = true;

    const game = parsed.tcg ?? "magic";

    void runQuestion(parsed.question, game);

    // eslint-disable-next-line react-hooks/exhaustive-deps -- auto-submit único via URL

  }, [searchParams]);



  const submit = useCallback(() => {

    void runQuestion(question, tcg);

  }, [question, tcg, runQuestion]);



  function handleTcgChange(next: TcgType) {
    hapticFeedback("light");
    ensureActiveRound(next);
    setTcg(next);
    setError(null);
    syncUrl(next, question.trim() || undefined);
  }



  function loadFromHistory(item: JudgeHistoryItem) {

    setTcg(item.tcg);

    setQuestion(item.question);

    setError(null);

    syncUrl(item.tcg, item.question);



    const restored: JudgeThreadTurn = {

      id: `restore-${item.id}`,

      question: item.question,

      response: {

        success: item.success,

        answer: item.answer,

        confidence: item.confidence,

        sources: item.sources ?? [],

        runtime_confidence: item.runtime_confidence ?? 0.94,

        verdict: item.verdict,

        rule_applied: item.rule_applied,

        explanation: item.explanation,

        exceptions: item.exceptions,

        confidence_notice_threshold: item.confidence_notice_threshold,

      } satisfies JudgeResponse,

      createdAt: item.createdAt,

    };

    setThreads((prev) => upsertThreadTurn(prev, item.tcg, restored));

    setTimeout(scrollToBottom, 100);

  }



  const handleRelatedSelect = useCallback((q: string) => {

    setQuestion(q);

  }, []);



  const showEmpty = currentTurns.length === 0 && !submitting && !error;



  const activeTurn = useMemo(() => {
    for (let i = currentTurns.length - 1; i >= 0; i -= 1) {
      const t = currentTurns[i];
      if (t.response?.sources?.length) return t;
    }
    return currentTurns[currentTurns.length - 1] ?? null;
  }, [currentTurns]);

  const activeSources = activeTurn?.response?.sources ?? [];
  const highlightTerms = useMemo(() => {
    if (!activeTurn?.response) return [];
    const parsed = parseJudgeVerdict(activeTurn.response);
    return extractHighlightTerms(parsed.ruleApplied, parsed.explanation);
  }, [activeTurn]);

  const matchLog = (
    <MatchLog
      tcg={tcg}
      items={history}
      onSelect={loadFromHistory}
      onClear={() => {
        clearJudgeHistory();
        setHistory([]);
      }}
    />
  );

  const centerZone = (
    <>
      <section className="judge-card rounded-2xl border p-4 sm:p-5">
        <GameMatSelector
          value={tcg}
          onChange={handleTcgChange}
          disabled={submitting}
          responsePanelId={RESPONSE_PANEL_ID}
          options={tcgOptions}
        />
      </section>

      <div
        id={RESPONSE_PANEL_ID}
        role="tabpanel"
        aria-labelledby={`judge-tcg-tab-${tcg}`}
        className="relative space-y-6"
      >
        {currentTurns.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-base font-bold text-[var(--tcg-text-primary)]">
              Mesa · {tcgBrand.emoji} {tcgBrand.icon}
            </h2>
            <JudgeThread
              tcg={tcg}
              turns={currentTurns}
              onRelatedSelect={handleRelatedSelect}
              historyByTurnId={historyByTurnId}
              hideSources
            />
          </section>
        )}

        {error && currentTurns.every((t) => !t.error) && (
          <ErrorCardState message={error} onRetry={submit} />
        )}

        {showEmpty && (
          <EmptyTableState tcg={tcg} onExampleClick={(example) => setQuestion(example)} />
        )}
      </div>

      <section className="judge-card space-y-4 rounded-2xl border p-4 sm:p-5">
        <h2 className="text-base font-bold text-[var(--tcg-text-primary)]">A sua dúvida</h2>
        <QuestionInput
          value={question}
          onChange={setQuestion}
          onSubmit={submit}
          disabled={submitting}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--tcg-text-secondary)]">
            Enter envia · Shift+Enter nova linha · contexto da partida mantido
          </p>
          <AskButton
            loading={submitting}
            disabled={!question.trim() || activeLoading}
            onClick={submit}
            accent={tcgBrand.accent}
            accentFg={tcgBrand.accentFg}
          />
        </div>
      </section>

      <div ref={bottomRef} />
    </>
  );

  return (
    <JudgeLayout tcg={tcg} health={health} warmupReady={health !== "offline"}>
      <JudgeToast />
      <GameTableLayout
        left={matchLog}
        center={centerZone}
        right={
          <RuleSourcesPanel
            sources={activeSources}
            tcg={tcg}
            highlightTerms={highlightTerms}
          />
        }
      />
    </JudgeLayout>
  );

}


