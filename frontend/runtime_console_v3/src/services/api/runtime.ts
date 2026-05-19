import { apiFetch } from "./client";
import type { AuthTokens, Incident, ReplayItem, RuntimeHealth, Tenant } from "@/types/runtime";

export const runtimeApi = {
  health: (token?: string | null) =>
    apiFetch<RuntimeHealth>("/runtime/health", { token }),

  v1Health: () => apiFetch<{ status: string }>("/v1/health"),

  metrics: (token?: string | null) =>
    apiFetch<{ metrics: Record<string, unknown>; integrity_status: string }>(
      "/runtime/metrics",
      { token },
    ),

  status: (token?: string | null) =>
    apiFetch<Record<string, unknown>>("/runtime/status", { token }),

  diagnostics: (token?: string | null) =>
    apiFetch<Record<string, unknown>>("/runtime/diagnostics", { token }),

  login: (username: string, password: string) =>
    apiFetch<{ authenticated: boolean; tokens: AuthTokens }>("/auth/login", {
      method: "POST",
      body: { username, password },
    }),

  refresh: (refresh_token: string) =>
    apiFetch<{ refreshed: boolean; tokens: AuthTokens }>("/auth/refresh", {
      method: "POST",
      body: { refresh_token },
    }),

  tenants: (token?: string | null) =>
    apiFetch<{ tenants: Tenant[] }>("/runtime/tenants", { token }),

  createTenant: (tenant_id: string, name: string, token?: string | null) =>
    apiFetch<Record<string, unknown>>(
      `/runtime/tenants?tenant_id=${encodeURIComponent(tenant_id)}&name=${encodeURIComponent(name)}`,
      { method: "POST", token },
    ),

  replays: (token?: string | null, tenant_id?: string) => {
    const q = tenant_id ? `?tenant_id=${encodeURIComponent(tenant_id)}` : "";
    return apiFetch<{ replays: ReplayItem[] }>(`/runtime/replay${q}`, { token });
  },

  federation: (token?: string | null) =>
    apiFetch<Record<string, unknown>>("/runtime/federation", { token }),

  incidents: (token?: string | null) =>
    apiFetch<{ incidents: Incident[] }>("/runtime/incidents", { token }),

  reportIncident: (
    body: { summary: string; tenant_id?: string; severity?: string },
    token?: string | null,
  ) =>
    apiFetch<Record<string, unknown>>("/runtime/incidents", {
      method: "POST",
      body,
      token,
    }),

  deployments: (token?: string | null) =>
    apiFetch<Record<string, unknown>>("/runtime/deployments", { token }),

  onboarding: (token?: string | null) =>
    apiFetch<Record<string, unknown>>("/runtime/onboarding", { token }),

  pilot: (token?: string | null) =>
    apiFetch<Record<string, unknown>>("/runtime/pilot", { token }),

  support: (token?: string | null) =>
    apiFetch<Record<string, unknown>>("/runtime/support", { token }),

  backup: (token?: string | null) =>
    apiFetch<Record<string, unknown>>("/runtime/backup", { method: "POST", token }),
};
