"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AskButton } from "@/components/judge/AskButton";
import { ErrorPanel } from "@/components/judge/ErrorPanel";
import { JudgeEmptyState } from "@/components/judge/JudgeEmptyState";
import { JudgeHistory } from "@/components/judge/JudgeHistory";
import { JudgeLayout } from "@/components/judge/JudgeLayout";
import { JudgeThread } from "@/components/judge/JudgeThread";
import { QuestionInput } from "@/components/judge/QuestionInput";
import { TcgSelector } from "@/components/judge/TcgSelector";
import { clearJudgeHistory, loadJudgeHistory, saveJudgeHistoryItem } from "@/lib/judge-history";
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
import { buildJudgeUrlParams, parseJudgeSearchParams } from "@/lib/judge-url";
import { getTcgBrand } from "@/lib/tcg-brand";
import { askJudgeQuestionPreferStream, getJudgeHealth, judgeErrorMessage } from "@/services/judgeApi";
import type { BackendHealthState, JudgeHistoryItem, JudgeResponse, TcgType } from "@/types/judge";

const RESPONSE_PANEL_ID = "judge-response-panel";

export function JudgePageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tcg, setTcg] = useState<TcgType>("magic");
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<JudgeHistoryItem[]>([]);
  const [threads, setThreads] = useState<JudgeThreads>({});
  const [health, setHealth] = useState<BackendHealthState>("offline");
  const bottomRef = useRef<HTMLDivElement>(null);
  const autoSubmitDone = useRef(false);
  const tcgBrand = getTcgBrand(tcg);
  const currentTurns = getThreadForTcg(threads, tcg);
  const activeLoading = currentTurns.some((t) => t.loading);

  const syncUrl = useCallback(
    (nextTcg: TcgType, q?: string) => {
      const params = buildJudgeUrlParams(nextTcg, q);
      router.replace(`/judge?${params.toString()}`, { scroll: false });
    },
    [router],
  );

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    setHistory(loadJudgeHistory());
    setThreads(loadJudgeThreads());
    getJudgeHealth().then(setHealth);
    const t = setInterval(() => getJudgeHealth().then(setHealth), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const parsed = parseJudgeSearchParams(searchParams);
    if (parsed.tcg) setTcg(parsed.tcg);
    if (parsed.question) setQuestion(parsed.question);
  }, [searchParams]);

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
            onToken: (text) => {
              setThreads((prev) => {
                const turns = getThreadForTcg(prev, game);
                const current = turns.find((t) => t.id === turnId);
                if (!current) return prev;
                return updateThreadTurn(prev, game, turnId, {
                  streamingText: `${current.streamingText ?? ""}${text}`,
                });
              });
            },
            onDone: (response) => {
              setThreads((prev) =>
                updateThreadTurn(prev, game, turnId, {
                  response,
                  loading: false,
                  streamingText: undefined,
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
          createdAt: new Date().toISOString(),
        };
        setHistory(saveJudgeHistoryItem(item));
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
    [submitting, syncUrl, scrollToBottom],
  );

  useEffect(() => {
    if (autoSubmitDone.current) return;
    const parsed = parseJudgeSearchParams(searchParams);
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
      } satisfies JudgeResponse,
      createdAt: item.createdAt,
    };
    setThreads((prev) => upsertThreadTurn(prev, item.tcg, restored));
    setTimeout(scrollToBottom, 100);
  }

  const showEmpty = currentTurns.length === 0 && !submitting && !error;

  return (
    <JudgeLayout
      tcg={tcg}
      health={health}
      sidebar={
        <div className="space-y-4">
          <JudgeHistory
            items={history}
            onSelect={loadFromHistory}
            onClear={() => {
              clearJudgeHistory();
              setHistory([]);
            }}
          />
          {currentTurns.length > 0 && (
            <button
              type="button"
              onClick={() => setThreads((prev) => clearThreadForTcg(prev, tcg))}
              className="w-full rounded-xl border border-[hsl(var(--border))] px-3 py-2 text-xs font-semibold text-[hsl(222_20%_35%)] transition hover:bg-[hsl(var(--muted))]"
            >
              Limpar conversa deste jogo
            </button>
          )}
        </div>
      }
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="judge-card rounded-2xl border border-[hsl(var(--border))] p-4 sm:p-5 lg:max-w-none">
          <TcgSelector
            value={tcg}
            onChange={handleTcgChange}
            disabled={submitting}
            responsePanelId={RESPONSE_PANEL_ID}
          />
        </section>

        <div
          id={RESPONSE_PANEL_ID}
          role="tabpanel"
          aria-labelledby={`judge-tcg-tab-${tcg}`}
          className="space-y-6"
        >
          {currentTurns.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-bold">Conversa · {tcgBrand.icon}</h2>
              </div>
              <JudgeThread tcg={tcg} turns={currentTurns} />
            </section>
          )}

          {error && currentTurns.every((t) => !t.error) && (
            <ErrorPanel message={error} onRetry={submit} />
          )}

          {showEmpty && (
            <JudgeEmptyState tcg={tcg} onExampleClick={(example) => setQuestion(example)} />
          )}
        </div>

        <section className="judge-card space-y-4 rounded-2xl border border-[hsl(var(--border))] p-4 sm:p-5">
          <h2 className="text-base font-bold">A sua dúvida</h2>
          <QuestionInput
            value={question}
            onChange={setQuestion}
            onSubmit={submit}
            disabled={submitting}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[hsl(222_15%_50%)]">
              Enter envia · Shift+Enter nova linha · conversa mantém contexto do jogo
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
      </div>
    </JudgeLayout>
  );
}
