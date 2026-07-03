"use client";

import { useQuery } from "@tanstack/react-query";
import type { PermissionMatrix } from "@/lib/seller-rbac";

export type StoreUserRoleData = {
  user_id: string;
  store_id: string;
  role: string;
  permissions?: PermissionMatrix | null;
  effective_permissions?: PermissionMatrix;
  is_active: boolean;
  is_owner?: boolean;
};

export function useStoreUserRole() {
  return useQuery({
    queryKey: ["seller-team-me"],
    queryFn: async () => {
      const res = await fetch("/api/seller/team/me");
      if (!res.ok) throw new Error("fetch_failed");
      const data = (await res.json()) as { role: StoreUserRoleData };
      return data.role;
    },
    staleTime: 60_000,
  });
}
