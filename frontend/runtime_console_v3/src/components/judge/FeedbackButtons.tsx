"use client";

import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { submitJudgeFeedback, type JudgeFeedbackPayload } from "@/services/judgeApi";

interface FeedbackButtonsProps {
  question: string;
  gameSlug: string;
  verdict?: string;
}

type FeedbackState = "idle" | "positive" | "negative" | "submitted";

export function FeedbackButtons({ question, gameSlug, verdict }: FeedbackButtonsProps) {
  const [state, setState] = useState<FeedbackState>("idle");
  const [comment, setComment] = useState("");
  const [showComment, setShowComment] = useState(false);

  const handleRating = async (rating: "positive" | "negative") => {
    setState(rating);
    setShowComment(rating === "negative");

    const payload: JudgeFeedbackPayload = {
      question,
      game_slug: gameSlug,
      verdict,
      rating,
    };

    await submitJudgeFeedback(payload);

    if (rating === "positive") {
      setState("submitted");
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
  };

  if (state === "submitted") {
    return <p className="mt-2 text-xs text-muted-foreground">Obrigado pelo feedback!</p>;
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Esta resposta foi útil?</span>
        <button
          type="button"
          onClick={() => void handleRating("positive")}
          disabled={state !== "idle"}
          aria-label="Resposta útil"
          className={`rounded-md border p-1.5 transition-colors ${
            state === "positive"
              ? "border-green-300 bg-green-50 text-green-600"
              : "border-border text-muted-foreground hover:border-green-300 hover:text-green-600"
          }`}
        >
          <ThumbsUp size={14} />
        </button>
        <button
          type="button"
          onClick={() => void handleRating("negative")}
          disabled={state !== "idle"}
          aria-label="Resposta não útil"
          className={`rounded-md border p-1.5 transition-colors ${
            state === "negative"
              ? "border-red-300 bg-red-50 text-red-600"
              : "border-border text-muted-foreground hover:border-red-300 hover:text-red-600"
          }`}
        >
          <ThumbsDown size={14} />
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
            className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-xs"
            autoFocus
          />
          <button
            type="button"
            onClick={() => void handleCommentSubmit()}
            className="rounded-md border border-border px-3 py-1.5 text-xs transition-colors hover:bg-muted"
          >
            Enviar
          </button>
        </div>
      )}
    </div>
  );
}
