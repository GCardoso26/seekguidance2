"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isFeatureEnabled } from "@/lib/feature-flags";
import { trackEvent } from "@/lib/analytics";

export type WishlistListSummary = {
  id: string;
  name: string;
  slug: string;
  is_default: boolean;
  item_count: number;
  share_token?: string | null;
};

export type WishlistListDetail = {
  list: WishlistListSummary;
  items: Array<{
    id: string;
    product_id: string;
    product?: Record<string, unknown>;
    added_at?: string;
    sort_order?: number;
  }>;
};

const LISTS_KEY = ["buyer-wishlists"] as const;

async function fetchLists(): Promise<{ lists: WishlistListSummary[] }> {
  const res = await fetch("/api/buyer/wishlists", { cache: "no-store" });
  if (res.status === 401) return { lists: [] };
  if (!res.ok) throw new Error("wishlist_lists_fetch_failed");
  return res.json();
}

async function fetchListDetail(listId: string): Promise<WishlistListDetail> {
  const res = await fetch(`/api/buyer/wishlists/${encodeURIComponent(listId)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("wishlist_detail_fetch_failed");
  return res.json();
}

export function useWishlistLists() {
  const enabled = isFeatureEnabled("WISHLIST_V2");
  return useQuery({
    queryKey: LISTS_KEY,
    queryFn: fetchLists,
    enabled,
    staleTime: 60_000,
  });
}

export function useWishlistListDetail(listId: string | null) {
  const enabled = isFeatureEnabled("WISHLIST_V2") && Boolean(listId);
  return useQuery({
    queryKey: [...LISTS_KEY, listId],
    queryFn: () => fetchListDetail(listId!),
    enabled,
    staleTime: 30_000,
  });
}

export function useCreateWishlistList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/buyer/wishlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("wishlist_create_failed");
      const data = await res.json();
      void trackEvent("wishlist_created", { name });
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LISTS_KEY });
    },
  });
}

export function useShareWishlistList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (listId: string) => {
      const res = await fetch(`/api/buyer/wishlists/${encodeURIComponent(listId)}/share`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("wishlist_share_failed");
      const data = await res.json();
      void trackEvent("wishlist_shared", { list_id: listId });
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LISTS_KEY });
    },
  });
}

export function useDuplicateWishlistList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (listId: string) => {
      const res = await fetch(
        `/api/buyer/wishlists/${encodeURIComponent(listId)}/duplicate`,
        { method: "POST" },
      );
      if (!res.ok) throw new Error("wishlist_duplicate_failed");
      return res.json();
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: LISTS_KEY });
    },
  });
}

export function useReorderWishlistList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ listId, itemIds }: { listId: string; itemIds: string[] }) => {
      const res = await fetch(`/api/buyer/wishlists/${encodeURIComponent(listId)}/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_ids: itemIds }),
      });
      if (!res.ok) throw new Error("wishlist_reorder_failed");
      return res.json();
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: LISTS_KEY });
      void qc.invalidateQueries({ queryKey: [...LISTS_KEY, vars.listId] });
    },
  });
}
