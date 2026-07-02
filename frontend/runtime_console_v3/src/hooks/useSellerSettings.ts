"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SellerSettings } from "@/types/seller-settings";

export type SettingsSection = "store" | "payments" | "shipping" | "api";

type PatchPayload = {
  section: SettingsSection;
  data: Record<string, unknown>;
};

async function fetchSellerSettings(storeId: string): Promise<SellerSettings> {
  const res = await fetch(`/api/marketplace/shop/stores/${encodeURIComponent(storeId)}/settings`);
  if (res.status === 401) throw new Error("login_required");
  if (res.status === 403) throw new Error("plan_forbidden");
  if (!res.ok) throw new Error("fetch_failed");
  return res.json() as Promise<SellerSettings>;
}

async function patchSellerSettings(storeId: string, payload: PatchPayload): Promise<SellerSettings> {
  const res = await fetch(`/api/marketplace/shop/stores/${encodeURIComponent(storeId)}/settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(String((data as { detail?: string }).detail ?? "save_failed"));
  }
  return data as SellerSettings;
}

export function useSellerSettings(storeId: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: ["seller-settings", storeId],
    queryFn: () => fetchSellerSettings(storeId!),
    enabled: Boolean(storeId) && enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateSellerSettings(storeId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PatchPayload) => patchSellerSettings(storeId!, payload),
    onSuccess: (data) => {
      qc.setQueryData(["seller-settings", storeId], data);
      void qc.invalidateQueries({ queryKey: ["seller-dashboard"] });
    },
  });
}
