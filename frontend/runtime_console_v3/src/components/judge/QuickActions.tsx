"use client";

import { useState } from "react";
import { Check, Copy, Heart, ExternalLink } from "lucide-react";
import type { JudgeResponse, TcgType } from "@/types/judge";
import { ShareVerdict } from "@/components/judge/ShareVerdict";
import { isJudgeFavorite, toggleJudgeFavorite } from "@/lib/judge-favorites";
import { showToast } from "@/lib/toast";
import type { JudgeHistoryItem } from "@/types/judge";

type Props = {
  tcg: TcgType;
  question: string;
  response: JudgeResponse;
  historyItem?: JudgeHistoryItem;
  onFavoriteChange?: () => void;
};

export function QuickActions({ tcg, question, response, historyItem, onFavoriteChange }: Props) {
  const [copied, setCopied] = useState(false);
  const [fav, setFav] = useState(historyItem ? isJudgeFavorite(historyItem.id) : false);

  async function copyAnswer() {
    const text = response.answer || response.explanation || "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast("Resposta copiada!", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copie a resposta:", text);
    }
  }

  function toggleFav() {
    if (!historyItem) return;
    toggleJudgeFavorite(historyItem);
    setFav(!fav);
    onFavoriteChange?.();
  }

  const firstSource = response.sources?.[0]?.url;

  return (
    <div className="flex flex-wrap gap-2 pt-2">
      <button
        type="button"
        onClick={() => void copyAnswer()}
        className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--border))] px-2.5 py-1 text-[10px] font-semibold"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        Copiar
      </button>
      <ShareVerdict tcg={tcg} question={question} response={response} />
      {firstSource && (
        <a
          href={firstSource}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--border))] px-2.5 py-1 text-[10px] font-semibold"
        >
          <ExternalLink className="h-3 w-3" />
          Regras
        </a>
      )}
      {historyItem && (
        <button
          type="button"
          onClick={toggleFav}
          className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--border))] px-2.5 py-1 text-[10px] font-semibold"
        >
          <Heart className={fav ? "h-3 w-3 fill-current text-red-500" : "h-3 w-3"} />
          Favorito
        </button>
      )}
    </div>
  );
}
