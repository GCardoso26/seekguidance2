"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  FulfillmentCommand,
  SellerFulfillmentProjection,
} from "@/types/seller-fulfillment";
import { invalidateAfterSellerSale } from "@/lib/player-journey";
import { awardXpFireAndForget } from "@/lib/award-xp-client";

async function fetchFulfillment(orderId: string): Promise<SellerFulfillmentProjection | null> {
  const res = await fetch(`/api/seller/orders/${encodeURIComponent(orderId)}/fulfillment`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("fulfillment_fetch_failed");
  const data = (await res.json()) as { fulfillment: SellerFulfillmentProjection | null };
  return data.fulfillment;
}

async function postCommand(
  orderId: string,
  body: { command: FulfillmentCommand; carrier?: string; tracking_code?: string },
) {
  const res = await fetch(`/api/seller/orders/${encodeURIComponent(orderId)}/fulfillment/commands`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(String(err.detail ?? "command_failed"));
  }
  return res.json();
}

export function useFulfillment(orderId: string | null, enabled: boolean) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["seller-fulfillment", orderId],
    queryFn: () => fetchFulfillment(orderId!),
    enabled: Boolean(orderId && enabled),
    staleTime: 15_000,
  });

  const mutation = useMutation({
    mutationFn: (body: { command: FulfillmentCommand; carrier?: string; tracking_code?: string }) =>
      postCommand(orderId!, body),
    onSuccess: () => {
      invalidateAfterSellerSale(queryClient);
      void queryClient.invalidateQueries({ queryKey: ["seller-fulfillment", orderId] });
      void queryClient.invalidateQueries({ queryKey: ["seller-order", orderId] });
      awardXpFireAndForget("seller_sale", queryClient);
    },
  });

  return { ...query, executeCommand: mutation.mutateAsync, isExecuting: mutation.isPending };
}
