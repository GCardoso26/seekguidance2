"use client";

import { useState } from "react";
import { ReviewStars } from "@/components/reviews/ReviewStars";
import { uploadImage } from "@/lib/supabase/storage";
import { showToast } from "@/lib/toast";

type Props = {
  orderId: string;
  storeSlug?: string;
  editReviewId?: string;
  initialComment?: string;
  initialPhotos?: string[];
  initialRating?: number;
  onSubmitted?: (storeSlug?: string) => void;
};

export function ReviewForm({
  orderId,
  storeSlug,
  editReviewId,
  initialComment = "",
  initialPhotos = [],
  initialRating = 0,
  onSubmitted,
}: Props) {
  const isEdit = Boolean(editReviewId);
  const [rating, setRating] = useState(initialRating);
  const [comment, setComment] = useState(initialComment);
  const [recommend, setRecommend] = useState(true);
  const [itemAsDescribed, setItemAsDescribed] = useState(true);
  const [shippingSpeed, setShippingSpeed] = useState(5);
  const [communication, setCommunication] = useState(5);
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 3 - photos.length);
    for (const file of files) {
      try {
        const url = await uploadImage(file, "shop-reviews");
        setPhotos((prev) => [...prev, url].slice(0, 3));
      } catch {
        showToast("Falha ao enviar foto", "error");
      }
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isEdit && rating < 1) {
      setError("Selecione uma nota");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const url = isEdit
        ? `/api/marketplace/shop/reviews/${encodeURIComponent(editReviewId!)}`
        : "/api/marketplace/shop/reviews";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEdit
            ? { comment: comment.trim() || null, photos }
            : {
                order_id: orderId,
                rating,
                comment: comment.trim() || null,
                photos,
                recommend,
                item_as_described: itemAsDescribed,
                shipping_speed: shippingSpeed,
                communication,
              },
        ),
      });
      const data = (await res.json().catch(() => ({}))) as { detail?: string };
      if (!res.ok) throw new Error(String(data.detail ?? "Falha ao enviar"));
      showToast(isEdit ? "Avaliação atualizada!" : "Avaliação publicada!", "success");
      onSubmitted?.(storeSlug);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-5">
      <div>
        <p className="mb-2 text-sm font-medium">Sua nota</p>
        <ReviewStars value={rating} onChange={isEdit ? undefined : setRating} size="lg" readonly={isEdit} />
        {isEdit && <p className="mt-1 text-xs text-muted-foreground">A nota não pode ser alterada após publicar.</p>}
      </div>
      <div>
        <label htmlFor="comment" className="mb-2 block text-sm font-medium">
          Comentário (opcional)
        </label>
        <textarea
          id="comment"
          maxLength={500}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className="w-full surface-card rounded-lg px-3 py-2 text-sm"
          placeholder="Conte como foi a experiência de compra…"
        />
        <p className="mt-1 text-xs text-muted-foreground">{comment.length}/500</p>
      </div>
      <div>
        <label className="text-sm">
          Fotos (até 3)
          <input type="file" accept="image/*" multiple onChange={(e) => void handlePhoto(e)} className="mt-2 block text-xs" />
        </label>
        {photos.length > 0 && (
          <div className="mt-2 flex gap-2">
            {photos.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt="" className="h-16 w-16 rounded-lg object-cover" />
            ))}
          </div>
        )}
      </div>
      {!isEdit && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium">Item conforme descrição?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setItemAsDescribed(true)}
                  className={`rounded-lg px-3 py-1 text-xs ${itemAsDescribed ? "bg-emerald-600/30" : "bg-muted"}`}
                >
                  Sim
                </button>
                <button
                  type="button"
                  onClick={() => setItemAsDescribed(false)}
                  className={`rounded-lg px-3 py-1 text-xs ${!itemAsDescribed ? "bg-red-600/30" : "bg-muted"}`}
                >
                  Não
                </button>
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Velocidade de envio</p>
              <ReviewStars value={shippingSpeed} onChange={setShippingSpeed} size="sm" />
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Comunicação</p>
            <ReviewStars value={communication} onChange={setCommunication} size="sm" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={recommend} onChange={(e) => setRecommend(e.target.checked)} />
            Recomendo esta loja
          </label>
        </>
      )}
      {error && <p className="text-sm text-red-300">{error}</p>}
      <button
        type="submit"
        disabled={loading || (!isEdit && rating < 1)}
        className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-50"
      >
        {loading ? "Enviando…" : isEdit ? "Salvar edição" : "Publicar avaliação"}
      </button>
    </form>
  );
}
