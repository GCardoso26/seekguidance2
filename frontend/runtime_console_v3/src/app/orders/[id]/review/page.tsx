"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { ShopReviewCard } from "@/components/reviews/ShopReviewCard";

function canEditReview(review: Record<string, unknown> | null): boolean {
  if (!review?.created_at) return false;
  if (Number(review.edit_count ?? 0) >= 1) return false;
  const created = new Date(String(review.created_at)).getTime();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  return Date.now() - created < sevenDays;
}

export default function OrderReviewPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams();
  const orderId = String(params.id ?? "");
  const [editing, setEditing] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["order-review", orderId],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/shop/orders/${encodeURIComponent(orderId)}`);
      if (!res.ok) throw new Error("Pedido não encontrado");
      return res.json() as Promise<{
        order: { status: string; store_name: string; store_slug: string };
        review: Record<string, unknown> | null;
      }>;
    },
    staleTime: 30_000,
  });

  const order = data?.order;
  const existing = data?.review;
  const editable = canEditReview(existing ?? null);

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-lg px-4 py-8">
        <Link href="/marketplace/orders" className="text-sm text-muted-foreground">
          ← Meus pedidos
        </Link>
        <h1 className="mt-4 text-2xl font-bold">Avaliar pedido</h1>
        {isLoading && <p className="mt-4 text-muted-foreground">Carregando…</p>}
        {error && <p className="mt-4 text-red-300">Pedido não encontrado.</p>}
        {order && !["delivered", "paid", "shipped"].includes(order.status) && (
          <p className="mt-4 text-amber-300">Aguarde a entrega do pedido para avaliar.</p>
        )}
        {existing && !editing && (
          <div className="mt-6">
            <p className="mb-3 text-sm text-muted-foreground">Você já avaliou este pedido:</p>
            <ShopReviewCard review={existing as never} />
            {editable && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="mt-4 text-sm text-primary underline"
              >
                Editar comentário ou fotos (7 dias)
              </button>
            )}
          </div>
        )}
        {existing && editing && (
          <div className="mt-6 surface-card p-6">
            <ReviewForm
              orderId={orderId}
              editReviewId={String(existing.id)}
              initialComment={String(existing.comment ?? "")}
              initialPhotos={(existing.photos as string[]) ?? []}
              initialRating={Number(existing.rating)}
              onSubmitted={() => {
                setEditing(false);
                void queryClient.invalidateQueries({ queryKey: ["order-review", orderId] });
              }}
            />
          </div>
        )}
        {order && !existing && ["delivered", "paid", "shipped"].includes(order.status) && (
          <div className="mt-6 surface-card p-6">
            <p className="mb-4 text-sm text-muted-foreground">
              Loja: <strong>{order.store_name}</strong>
            </p>
            <ReviewForm
              orderId={orderId}
              storeSlug={order.store_slug}
              onSubmitted={(slug) => router.push(slug ? `/stores/${slug}` : "/marketplace/orders")}
            />
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
