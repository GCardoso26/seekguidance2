import { describe, expect, it } from "vitest";
import { InfractionClassifier } from "@/lib/infractions/InfractionClassifier";
import { AppealManager } from "@/lib/infractions/appeals";
import type { InfractionReport } from "@/lib/infractions/schema";

describe("InfractionClassifier", () => {
  const classifier = new InfractionClassifier();

  it("classifica slow play", () => {
    const r = classifier.classify("O jogador está demorando muito no turno");
    expect(r.suggested_type).toBe("slow_play");
    expect(r.suggested_severity).toBe("minor");
  });

  it("classifica cheating", () => {
    const r = classifier.classify("Suspeita que trapaceou e viu cartas");
    expect(r.suggested_type).toBe("cheating");
    expect(r.suggested_severity).toBe("severe");
  });

  it("calcula SLA competitive em 2 min", () => {
    const from = new Date("2026-06-04T12:00:00Z");
    const deadline = classifier.calculateSLA("competitive", from);
    expect(deadline.getTime() - from.getTime()).toBe(2 * 60_000);
  });
});

describe("AppealManager", () => {
  const manager = new AppealManager();
  const base: InfractionReport = {
    id: "1",
    match_id: "m",
    reported_by: "p",
    reported_by_seat: 1,
    type: "other",
    severity: "minor",
    category: "procedural",
    description: "x",
    status: "resolved",
    resolution: {
      judge_notes: "ok",
      resolved_at: new Date().toISOString(),
      resolved_by: "j",
    },
    reported_at: new Date().toISOString(),
    sla_deadline: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  it("workflow de appeal", () => {
    const appealed = manager.requestAppeal(base, "Discordo da penalidade");
    expect(appealed.status).toBe("appealed");
    const reviewed = manager.reviewAppeal(appealed, "judge-2", "rejected", "Mantida");
    expect(reviewed.appeal?.status).toBe("rejected");
  });
});
