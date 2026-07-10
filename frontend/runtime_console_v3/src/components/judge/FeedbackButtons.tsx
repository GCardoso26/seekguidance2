"use client";

import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import confetti from "canvas-confetti";
import { submitJudgeFeedback, type JudgeFeedbackPayload } from "@/services/judgeApi";
import { hapticFeedback } from "@/utils/haptic";
import { showToast } from "@/lib/toast";
import { cn } from "@/lib/utils";

interface FeedbackButtonsProps {
  question: string;
  gameSlug: string;
  verdict?: string;
}

type FeedbackState = "idle" | "positive" | "negative" | "submitted";

function firePositiveConfetti() {
  const root = typeof document !== "undefined" ? getComputedStyle(document.documentElement) : null;
  const color =
    root?.getPropertyValue("--tcg-primary-light").trim() ||
    root?.getPropertyValue("--tcg-primary").trim() ||
    "#4A90D9";

  void confetti({
    particleCount: 28,
    spread: 60,
    origin: { y: 0.75 },
    colors: [color, "#ffffff", "#facc15"],
    disableForReducedMotion: true,
    gravity: 1.2,
    scalar: 0.85,
  });
}

export function FeedbackButtons({ question, gameSlug, verdict }: FeedbackButtonsProps) {
  const [state, setState] = useState<FeedbackState>("idle");
  const [comment, setComment] = useState("");
  const [showComment, setShowComment] = useState(false);

  const handleRating = async (rating: "positive" | "negative") => {
    setState(rating);
    setShowComment(rating === "negative");
    hapticFeedback(rating === "positive" ? "light" : "medium");

    if (rating === "positive") {
      firePositiveConfetti();
    }

    const payload: JudgeFeedbackPayload = {
      question,
      game_slug: gameSlug,
      verdict,
      rating,
    };

    await submitJudgeFeedback(payload);

    if (rating === "positive") {
      setState("submitted");
      showToast("Obrigado pelo feedback!", "success");
    }
  };

  const handleCommentSubmit = async () => {
    if (!comment.trim()) {
      setState("submitted");
      setShowComment(false);
      return;
    }
    await submitJudgeFeedback({
      question,
      game_slug: gameSlug,
      verdict,
      rating: "negative",
      comment,
    });
    setState("submitted");
    setShowComment(false);
    showToast("Feedback enviado", "info");
  };

  if (state === "submitted") {
    return <p className="mt-2 text-xs text-[var(--tcg-text-secondary)]">Obrigado pelo feedback!</p>;
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-[var(--tcg-text-secondary)]">Esta resposta foi útil?</span>
        <button
          type="button"
          onClick={() => void handleRating("positive")}
          disabled={state !== "idle"}
          aria-label="Resposta útil"
          className={cn(
            "verdict-card min-h-12 min-w-12 rounded-lg border p-2.5 transition-colors",
            state === "positive"
              ? "border-green-500/50 bg-green-500/15 text-green-400"
              : "border-[var(--tcg-border)] text-[var(--tcg-text-secondary)] hover:border-green-500/40 hover:text-green-400",
          )}
        >
          <ThumbsUp size={18} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => void handleRating("negative")}
          disabled={state !== "idle"}
          aria-label="Resposta não útil"
          className={cn(
            "verdict-card min-h-12 min-w-12 rounded-lg border p-2.5 transition-colors",
            state === "negative"
              ? "border-red-500/50 bg-red-500/15 text-danger"
              : "border-[var(--tcg-border)] text-[var(--tcg-text-secondary)] hover:border-red-500/40 hover:text-danger",
          )}
        >
          <ThumbsDown size={18} aria-hidden />
        </button>
      </div>

      {showComment && (
        <div className="flex animate-in fade-in slide-in-from-top-1 gap-2 duration-200">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void handleCommentSubmit()}
            placeholder="O que estava errado? (opcional)"
            maxLength={500}
            className="flex-1 rounded-md border border-[var(--tcg-border)] bg-[var(--tcg-surface)] px-2 py-2 text-xs text-[var(--tcg-text-primary)]"
            autoFocus
          />
          <button
            type="button"
            onClick={() => void handleCommentSubmit()}
            className="verdict-card min-h-12 rounded-md border border-[var(--tcg-border)] px-3 text-xs font-medium hover:bg-muted/80"
          >
            Enviar
          </button>
        </div>
      )}
    </div>
  );
}
