import { apiFetch } from "./client";

import type { Incident, ReplayItem, RuntimeHealth, Tenant } from "@/types/runtime";



export const runtimeApi = {

  health: () => apiFetch<RuntimeHealth>("/runtime/health"),



  v1Health: () => apiFetch<{ status: string }>("/v1/health", { publicRoute: true }),



  metrics: () =>

    apiFetch<{ metrics: Record<string, unknown>; integrity_status: string }>("/runtime/metrics"),



  status: () => apiFetch<Record<string, unknown>>("/runtime/status"),



  diagnostics: () => apiFetch<Record<string, unknown>>("/runtime/diagnostics"),



  login: async (username: string, password: string) => {

    const res = await fetch("/api/auth/login", {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      credentials: "include",

      body: JSON.stringify({ username, password }),

    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Login failed");

    return data as { authenticated: boolean; user?: { username?: string }; tenant_id?: string };

  },



  setApiKey: async (api_key: string) => {

    const res = await fetch("/api/auth/api-key", {

      method: "POST",

      headers: { "Content-Type": "application/json" },

      credentials: "include",

      body: JSON.stringify({ api_key }),

    });

    if (!res.ok) throw new Error("Invalid API key");

    return res.json();

  },



  logout: () =>

    fetch("/api/auth/logout", { method: "POST", credentials: "include" }),



  tenants: () => apiFetch<{ tenants: Tenant[] }>("/runtime/tenants"),



  createTenant: (tenant_id: string, name: string) =>

    apiFetch<Record<string, unknown>>(

      `/runtime/tenants?tenant_id=${encodeURIComponent(tenant_id)}&name=${encodeURIComponent(name)}`,

      { method: "POST" },

    ),



  replays: () => apiFetch<{ replays: ReplayItem[] }>("/runtime/replay"),



  federation: () => apiFetch<Record<string, unknown>>("/runtime/federation"),



  incidents: () => apiFetch<{ incidents: Incident[] }>("/runtime/incidents"),



  reportIncident: (body: { summary: string; severity?: string }) =>

    apiFetch<Record<string, unknown>>("/runtime/incidents", {

      method: "POST",

      body,

    }),



  deployments: () => apiFetch<Record<string, unknown>>("/runtime/deployments"),



  onboarding: () => apiFetch<Record<string, unknown>>("/runtime/onboarding"),



  pilot: () => apiFetch<Record<string, unknown>>("/runtime/pilot"),



  support: () => apiFetch<Record<string, unknown>>("/runtime/support"),



  backup: () => apiFetch<Record<string, unknown>>("/runtime/backup", { method: "POST" }),

};


