import { describe, expect, it } from "vitest";
import { isSafeInternalPath, normalizeInternalPath } from "@/lib/auth/safe-path";

describe("safe-path", () => {
  it("aceita paths internos válidos", () => {
    expect(isSafeInternalPath("/judge")).toBe(true);
    expect(isSafeInternalPath("/player/me")).toBe(true);
    expect(normalizeInternalPath("judge")).toBe("/judge");
  });

  it("rejeita open redirect protocol-relative", () => {
    expect(isSafeInternalPath("//evil.com")).toBe(false);
    expect(normalizeInternalPath("//evil.com")).toBe("/judge");
  });

  it("rejeita URLs com protocolo", () => {
    expect(isSafeInternalPath("/https://evil.com")).toBe(false);
    expect(isSafeInternalPath("https://evil.com")).toBe(false);
  });
});
