"use client";
import { Badge } from "@/components/ui/badge";
import { runtimeTokens } from "@/lib/theme";

export function HealthBadge({ status }: { status?: string }) {
  const s = status === "ok" ? "success" : status === "degraded" ? "warning" : "danger";
  return <Badge variant={s}>{status || "unknown"}</Badge>;
}
