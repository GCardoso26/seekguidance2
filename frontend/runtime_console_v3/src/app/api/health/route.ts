import { NextResponse } from "next/server";
import type { ServiceHealth, ServiceHealthStatus } from "@/types/service-health";

export type { ServiceHealth, ServiceHealthStatus };

const MOCK_SERVICES: ServiceHealth[] = [
  { name: "API Principal", status: "online" },
  { name: "Banco de Regras", status: "online" },
  { name: "AI Judge", status: "online" },
];

export async function GET() {
  const services = MOCK_SERVICES.map((service) => {
    const override = process.env[`HEALTH_MOCK_${service.name.replace(/\s+/g, "_").toUpperCase()}`];
    if (override === "offline" || override === "degraded" || override === "online") {
      return { ...service, status: override };
    }
    return service;
  });

  const hasIssue = services.some((s) => s.status === "offline" || s.status === "degraded");

  return NextResponse.json({
    status: hasIssue ? "degraded" : "ok",
    services,
    checkedAt: new Date().toISOString(),
  });
}
