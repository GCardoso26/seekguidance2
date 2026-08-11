"use client";



import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { AskButton } from "@/components/judge/AskButton";


import { EmptyTableState } from "@/components/judge/EmptyTableState";
import { GalleryFade } from "@/components/gallery/GalleryMotion";
import { ErrorCardState } from "@/components/judge/ErrorCardState";
import { JudgeToast } from "@/components/judge/JudgeToast";
import { TCGDropZone, TCGSelector, TCGSelectorProvider } from "@/components/judge/TcgSelector";
import { GameTableLayout } from "@/components/judge/GameTableLayout";

import { JudgeLayout } from "@/components/judge/JudgeLayout";

import { JudgeThread } from "@/components/judge/JudgeThread";

import { MatchLog } from "@/components/judge/MatchLog";

import { QuestionInput } from "@/components/judge/QuestionInput";

import { ConsultationHistory } from "@/components/judge/ConsultationHistory";
import { PlanLimitBanner } from "@/components/judge/PlanLimitBanner";
import { useUpgradeModal } from "@/components/premium/UpgradeModalProvider";
import { RuleSourcesPanel } from "@/components/judge/RuleSourcesPanel";

import { useConsultations } from "@/hooks/useConsultations";
import { useJudgePageInit } from "@/hooks/useJudgePageInit";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { useOnboarding } from "@/hooks/useOnboarding";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";

import { loadJudgeHistoryHybrid, persistJudgeHistoryItem } from "@/lib/judge-cloud-history";

import { clearJudgeHistory } from "@/lib/judge-history";

import {

  buildThreadContext,

  getThreadForTcg,

  updateThreadTurn,

  upsertThreadTurn,

  type JudgeThreadTurn,

} from "@/lib/judge-thread";

import { appendQuestionToRound, ensureActiveRound, getRoundById } from "@/lib/match-log";
import { buildJudgeUrlParams, isValidTcgType, parseJudgeSearchParams } from "@/lib/judge-url";
import { hapticFeedback } from "@/utils/haptic";

import { extractHighlightTerms, parseJudgeVerdict } from "@/lib/judge-verdict";

import { getTcgBrand } from "@/lib/tcg-brand";

import { fetchJudgeShare } from "@/services/judgeShareApi";

import { askJudgeQuestionPreferStream, judgeErrorMessage } from "@/services/judgeApi";

import { recordGrowthEvent } from "@/services/judgeGrowthApi";

import type { JudgeHistoryItem, JudgeResponse, TcgType } from "@/types/judge";

import { TCG_OPTIONS } from "@/types/judge";



const RESPONSE_PANEL_ID = "judge-response-panel";



export function JudgePageClient() {

  const router = useRouter();

  const searchParams = useSearchParams();

  const { user } = useJudgeAuth();
  const { needsOnboarding, isLoading: onboardingLoading } = useOnboarding();
  const { data: profile } = usePlayerProfile(user ? "me" : "");

  const [tcg, setTcg] = useState<TcgType>("magic");

  const [question, setQuestion] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [historyByTurnId, setHistoryByTurnId] = useState<Record<string, JudgeHistoryItem>>({});

  const { history, setHistory, threads, setThreads, tcgOptions } = useJudgePageInit(searchParams, user?.id);

  const [historySignal, setHistorySignal] = useState(0);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);

  const planLimits = usePlanLimits({
    favoriteTcgs: profile?.favoriteTcgs as TcgType[] | undefined,
    onboardingComplete: Boolean(profile?.hasCompletedOnboarding || (profile?.favoriteTcgs?.length ?? 0) >= 5),
  });
  const { showUpgrade } = useUpgradeModal();
  const consultations = useConsultations(user?.id);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || onboardingLoading) return;
    if (needsOnboarding) router.replace("/onboarding");
  }, [user, needsOnboarding, onboardingLoading, router]);

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

      if (!planLimits.canAskQuestion()) {
        setError("Limite diário de consultas atingido. Faça upgrade para continuar.");
        return;
      }

      if (!planLimits.canUseTCG(game)) {
        setError("Este TCG requer plano Spike. Veja os planos em /pricing.");
        return;
      }
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

        planLimits.refreshDailyCount();
        void fetch("/api/badges/check", { method: "POST" });
        void consultations.reload();

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

    [submitting, syncUrl, scrollToBottom, user?.id, planLimits, consultations],

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
    if (!planLimits.canUseTCG(next)) {
      setError("Este TCG está disponível no plano Spike.");
      return;
    }
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



  const handleRelatedSelect = useCallback(
    (q: string) => {
      void runQuestion(q, tcg);
    },
    [runQuestion, tcg],
  );

  const openHistory = useCallback(() => {
    setHistoryDrawerOpen(true);
    setHistorySignal((n) => n + 1);
  }, []);



  const questionBlocked = !planLimits.canAskQuestion();
  const tcgBlocked = !planLimits.canUseTCG(tcg);
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
    <TCGSelectorProvider value={tcg} onChange={handleTcgChange}>
      <section className="judge-card rounded-2xl border p-4 sm:p-5">
        <TCGSelector
          value={tcg}
          onChange={handleTcgChange}
          disabled={submitting}
          responsePanelId={RESPONSE_PANEL_ID}
          options={tcgOptions}
          isTcgLocked={(id) => !planLimits.canUseTCG(id)}
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
              Mesa · {tcgBrand.icon}
            </h2>
            <JudgeThread
              tcg={tcg}
              turns={currentTurns}
              onRelatedSelect={handleRelatedSelect}
              historyByTurnId={historyByTurnId}
              hideSources
              relatedAutoSubmit
            />
          </section>
        )}

        {error && currentTurns.every((t) => !t.error) && (
          <ErrorCardState message={error} onRetry={submit} />
        )}

        {showEmpty && (
          <TCGDropZone>
            <GalleryFade>
              <EmptyTableState
                tcg={tcg}
                tcgSelected
                onExampleClick={(example) => void runQuestion(example, tcg)}
              />
            </GalleryFade>
          </TCGDropZone>
        )}
      </div>

      <section className="judge-card space-y-4 rounded-2xl border p-4 sm:p-5">
        <h2 className="text-base font-bold text-[var(--tcg-text-primary)]">A sua dúvida</h2>
        {tcgBlocked && (
          <PlanLimitBanner variant="tcg" tcgName={TCG_OPTIONS.find((g) => g.id === tcg)?.label} />
        )}
        {questionBlocked && <PlanLimitBanner variant="questions" />}
        <div
          className={
            questionBlocked ? "relative opacity-50 blur-[1px]" : undefined
          }
        >
          {questionBlocked && (
            <button
              type="button"
              onClick={() => showUpgrade("consultas")}
              className="absolute inset-0 z-10 cursor-pointer rounded-xl"
              aria-label="Limite atingido — fazer upgrade"
            />
          )}
          <QuestionInput
            value={question}
            onChange={setQuestion}
            onSubmit={submit}
            disabled={submitting || questionBlocked}
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--tcg-text-secondary)]">
            Enter envia · Shift+Enter nova linha · contexto da partida mantido
          </p>
          <AskButton
            loading={submitting}
            disabled={!question.trim() || activeLoading || questionBlocked || tcgBlocked}
            onClick={submit}
            accent={tcgBrand.accent}
            accentFg={tcgBrand.accentFg}
          />
        </div>
      </section>

      <div ref={bottomRef} />
    </TCGSelectorProvider>
  );

  return (
    <JudgeLayout tcg={tcg} onHistoryClick={openHistory}>
      <JudgeToast />
      <ConsultationHistory
        open={historyDrawerOpen}
        onClose={() => setHistoryDrawerOpen(false)}
        items={consultations.items}
        loading={consultations.loading}
        query={consultations.query}
        onQueryChange={consultations.setQuery}
        tcgFilter={consultations.tcgFilter}
        onTcgFilterChange={consultations.setTcgFilter}
        favoritesOnly={consultations.favoritesOnly}
        onFavoritesOnlyChange={consultations.setFavoritesOnly}
        isFavorite={consultations.isFavorite}
        onToggleFavorite={consultations.toggleFavorite}
        onSelect={loadFromHistory}
        onDelete={consultations.removeLocal}
      />
      <GameTableLayout
        openHistorySignal={historySignal}
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


