/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRoundTimer } from "@/hooks/useRoundTimer";

describe("useRoundTimer", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("formata tempo inicial", () => {
    const { result } = renderHook(() => useRoundTimer(null));
    expect(result.current.formatted).toBe("0:00");
    expect(result.current.status).toBe("pending");
  });

  it("formata minutos e segundos", () => {
    const { result } = renderHook(() => useRoundTimer(null));
    expect(result.current.formatted).toMatch(/^\d+:\d{2}$/);
  });
});
