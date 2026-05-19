export type IntegrityStatus = "ok" | "degraded";

export interface RuntimeHealth {
  status: string;
  integrity_status: IntegrityStatus;
  latency_ms?: number;
  observability?: Record<string, unknown>;
  persistence?: Record<string, unknown>;
}

export interface Tenant {
  tenant_id: string;
  name: string;
  owner?: string;
  quota_events?: number;
  quota_replays?: number;
}

export interface Incident {
  id: number;
  tenant_id: string;
  summary: string;
  severity: string;
  escalated: boolean;
  created_at: number;
}

export interface ReplayItem {
  replay_id: string;
  tenant_id: string;
  scope: string;
  integrity_hash: string;
  created_at: number;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}
