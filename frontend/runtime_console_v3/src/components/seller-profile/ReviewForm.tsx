"use client";

import { useState } from "react";
import { StarRating } from "@/components/ui/StarRating";
import { customToast } from "@/components/ui/Toast";

type Props = {
  sellerUsername: string;
};

export function ReviewForm({ sellerUsername }: Props) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/marketplace/sellers/${encodeURIComponent(sellerUsername)}/reviews`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating, comment }),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Não foi possível enviar a avaliação");
      }
      customToast.success("Avaliação enviada!");
      setComment("");
    } catch (err) {
      customToast.error(err instanceof Error ? err.message : "Erro ao avaliar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border/50 p-4">
      <h3 className="text-sm font-semibold">Deixe sua avaliação</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Avaliações exigem um pedido entregue vinculado à sua conta.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-sm">Nota:</span>
        <button
          type="button"
          className="flex gap-1"
          onClick={() => setRating((r) => Math.min(5, r + 1))}
          aria-label="Alterar nota"
        >
          <StarRating rating={rating} />
        </button>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Conte como foi sua experiência…"
        rows={3}
        className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={submitting}
        className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
      >
        {submitting ? "Enviando…" : "Enviar avaliação"}
      </button>
    </form>
  );
}
