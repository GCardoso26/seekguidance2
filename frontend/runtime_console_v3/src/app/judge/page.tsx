"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AskButton } from "@/components/judge/AskButton";
import { ErrorPanel } from "@/components/judge/ErrorPanel";
import { JudgeHistory } from "@/components/judge/JudgeHistory";
import { JudgeLayout } from "@/components/judge/JudgeLayout";
import { LoadingPanel } from "@/components/judge/LoadingPanel";
import { QuestionInput } from "@/components/judge/QuestionInput";
import { ResponseCard } from "@/components/judge/ResponseCard";
import { TcgSelector } from "@/components/judge/TcgSelector";
import { clearJudgeHistory, loadJudgeHistory, saveJudgeHistoryItem } from "@/lib/judge-history";
import { askJudgeQuestion, getJudgeHealth, judgeErrorMessage } from "@/services/judgeApi";
import type { BackendHealthState, JudgeHistoryItem, JudgeResponse, TcgType } from "@/types/judge";

export default function JudgePage() {
  const [tcg, setTcg] = useState<TcgType>("magic");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<JudgeResponse | null>(null);
  const [lastQuestion, setLastQuestion] = useState("");
  const [history, setHistory] = useState<JudgeHistoryItem[]>([]);
  const [health, setHealth] = useState<BackendHealthState>("offline");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHistory(loadJudgeHistory());
    getJudgeHealth().then(setHealth);
    const t = setInterval(() => getJudgeHealth().then(setHealth), 30_000);
    return () => clearInterval(t);
  }, []);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const submit = useCallback(async () => {
    const q = question.trim();
    if (!q || loading) return;
    setLoading(true);
    setError(null);
    setLastQuestion(q);
    try {
      const res = await askJudgeQuestion({ tcg, question: q });
      setResponse(res);
      const item: JudgeHistoryItem = {
        id: `${Date.now()}`,
        tcg,
        question: q,
        answer: res.answer,
        success: res.success,
        confidence: res.confidence,
        createdAt: new Date().toISOString(),
      };
      setHistory(saveJudgeHistoryItem(item));
      setTimeout(scrollToBottom, 100);
    } catch (e) {
      setError(judgeErrorMessage(e));
      setResponse(null);
    } finally {
      setLoading(false);
    }
  }, [question, loading, tcg, scrollToBottom]);

  function loadFromHistory(item: JudgeHistoryItem) {
    setTcg(item.tcg);
    setQuestion(item.question);
    setResponse({
      success: item.success,
      answer: item.answer,
      confidence: item.confidence,
      sources: [],
      runtime_confidence: 0.94,
    });
    setLastQuestion(item.question);
    setError(null);
  }

  const showEmpty = !loading && !response && !error;

  return (
    <JudgeLayout
      health={health}
      sidebar={
        <JudgeHistory
          items={history}
          onSelect={loadFromHistory}
          onClear={() => {
            clearJudgeHistory();
            setHistory([]);
          }}
        />
      }
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="judge-card rounded-2xl border border-[hsl(var(--border))] p-4 sm:p-5 lg:max-w-none">
          <TcgSelector value={tcg} onChange={setTcg} disabled={loading} />
        </section>

        <section className="judge-card space-y-4 rounded-2xl border border-[hsl(var(--border))] p-4 sm:p-5">
          <h2 className="text-base font-bold">A sua dúvida</h2>
          <QuestionInput value={question} onChange={setQuestion} onSubmit={submit} disabled={loading} />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[hsl(222_15%_50%)]">Enter envia · Shift+Enter nova linha</p>
            <AskButton loading={loading} disabled={!question.trim()} onClick={submit} />
          </div>
        </section>

        {loading && <LoadingPanel />}

        {error && <ErrorPanel message={error} onRetry={submit} />}

        {showEmpty && (
          <div className="judge-card rounded-2xl border border-dashed border-[hsl(var(--border))] p-10 text-center">
            <p className="text-sm font-medium text-[hsl(222_20%_35%)]">
              Faça uma pergunta sobre as regras oficiais do jogo seleccionado.
            </p>
            <p className="mt-2 text-xs text-[hsl(222_15%_50%)]">
              Ex.: &quot;O que acontece na fase de manutenção?&quot; ou &quot;Como funciona trample?&quot;
            </p>
          </div>
        )}

        {response && !loading && (
          <section className="space-y-2">
            <h2 className="text-base font-bold">Resposta</h2>
            <ResponseCard response={response} question={lastQuestion} />
          </section>
        )}

        <div ref={bottomRef} />
      </div>
    </JudgeLayout>
  );
}
