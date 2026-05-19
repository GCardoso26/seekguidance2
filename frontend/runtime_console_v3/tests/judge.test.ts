import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadJudgeHistory, saveJudgeHistoryItem, clearJudgeHistory } from "@/lib/judge-history";
import { mapHealthStatus, judgeErrorMessage } from "@/services/judgeApi";
import { ApiError } from "@/services/api/client";
import { TCG_OPTIONS } from "@/types/judge";

describe("judge history", () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => store.set(k, v),
      removeItem: (k: string) => store.delete(k),
    });
    clearJudgeHistory();
  });

  it("persists up to 10 items", () => {
    for (let i = 0; i < 12; i++) {
      saveJudgeHistoryItem({
        id: `id-${i}`,
        tcg: "magic",
        question: `q${i}`,
        answer: "a",
        success: true,
        confidence: 0.9,
        createdAt: new Date().toISOString(),
      });
    }
    const items = loadJudgeHistory();
    expect(items.length).toBe(10);
    expect(items[0].question).toBe("q11");
  });
});

describe("judgeApi helpers", () => {
  it("maps health online", () => {
    expect(mapHealthStatus({ status: "ok", integrity_status: "ok" })).toBe("online");
  });

  it("maps health offline", () => {
    expect(mapHealthStatus(null)).toBe("offline");
  });

  it("formats network error", () => {
    expect(judgeErrorMessage(new ApiError("Network error — API unreachable", 0))).toContain("servidor");
  });
});

describe("tcg options", () => {
  it("only magic enabled", () => {
    const enabled = TCG_OPTIONS.filter((o) => o.enabled);
    expect(enabled).toHaveLength(1);
    expect(enabled[0].id).toBe("magic");
  });
});
