import { NextResponse } from "next/server";
import type { ServiceHealth, ServiceHealthStatus } from "@/types/service-health";

export type { ServiceHealth, ServiceHealthStatus };

const API_BASE = (process.env.API_PROXY_TARGET || "http://127.0.0.1:8000").replace(/\/$/, "");

function mapServiceStatus(name: string, value: string | undefined): ServiceHealthStatus {
  if (value === "ok" || value === "disabled") return "online";
  if (value === "error") return "offline";
  return "degraded";
}

export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/v1/health`, { cache: "no-store", next: { revalidate: 0 } });
    if (!res.ok) {
      return NextResponse.json(
        {
          status: "degraded",
          services: [{ name: "API Principal", status: "offline" as ServiceHealthStatus }],
          checkedAt: new Date().toISOString(),
        },
        { status: 503 },
      );
    }

    const data = (await res.json()) as {
      status?: string;
      services?: Record<string, string>;
    };

    const backendServices = data.services ?? {};
    const services: ServiceHealth[] = [
      { name: "API Principal", status: data.status === "healthy" ? "online" : "degraded" },
      { name: "Banco de Dados", status: mapServiceStatus("database", backendServices.database) },
      { name: "Redis", status: mapServiceStatus("redis", backendServices.redis) },
      { name: "Push FCM", status: mapServiceStatus("fcm", backendServices.fcm) },
    ];

    const hasIssue = services.some((s) => s.status === "offline" || s.status === "degraded");

    return NextResponse.json({
      status: hasIssue ? "degraded" : "ok",
      services,
      checkedAt: new Date().toISOString(),
      backend: data,
    });
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        services: [{ name: "API Principal", status: "offline" as ServiceHealthStatus }],
        checkedAt: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
