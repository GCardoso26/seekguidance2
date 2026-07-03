"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PermissionMatrix } from "@/lib/seller-rbac";

export type TeamUserRow = {
  id?: string;
  user_id: string;
  store_id?: string;
  role: string;
  display_name?: string | null;
  profile_name?: string | null;
  handle?: string | null;
  invited_email?: string | null;
  is_active?: boolean;
  is_owner?: boolean;
  permissions?: PermissionMatrix | null;
  effective_permissions?: PermissionMatrix;
};

export type TeamLogRow = {
  id: string;
  action: string;
  user_id: string;
  actor_name?: string | null;
  resource_type?: string | null;
  resource_id?: string | null;
  details?: Record<string, unknown>;
  created_at: string;
};

export function useTeamUsers() {
  return useQuery({
    queryKey: ["seller-team-users"],
    queryFn: async () => {
      const res = await fetch("/api/seller/team/users");
      if (!res.ok) throw new Error("fetch_failed");
      return res.json() as Promise<{ users: TeamUserRow[] }>;
    },
  });
}

export function useTeamLogs(page = 1) {
  return useQuery({
    queryKey: ["seller-team-logs", page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      const res = await fetch(`/api/seller/team/logs?${params}`);
      if (!res.ok) throw new Error("fetch_failed");
      return res.json() as Promise<{ logs: TeamLogRow[]; total: number }>;
    },
  });
}

export function useInviteTeamUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { email: string; role: string; display_name?: string }) => {
      const res = await fetch("/api/seller/team/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("invite_failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seller-team-users"] }),
  });
}

export function useUpdateTeamRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await fetch(`/api/seller/team/users/${encodeURIComponent(userId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error("role_failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seller-team-users"] }),
  });
}

export function useUpdateTeamPermissions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      permissions,
    }: {
      userId: string;
      permissions: PermissionMatrix;
    }) => {
      const res = await fetch(`/api/seller/team/users/${encodeURIComponent(userId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions }),
      });
      if (!res.ok) throw new Error("perms_failed");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["seller-team-users"] }),
  });
}
