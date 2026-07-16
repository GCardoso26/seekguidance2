import { describe, expect, it, afterEach } from "vitest";
import {
  FixedClock,
  SequentialIdGenerator,
  getClock,
  getHashPort,
  getIdGenerator,
  resetClock,
  resetIdGenerator,
  setClock,
  setIdGenerator,
} from "../../shared/index.js";

describe("Guard rail ports", () => {
  afterEach(() => {
    resetClock();
    resetIdGenerator();
  });

  it("Clock is injectable and deterministic", () => {
    const fixed = new FixedClock(new Date("2026-07-16T15:00:00.000Z"));
    setClock(fixed);
    expect(getClock().nowIso()).toBe("2026-07-16T15:00:00.000Z");
    fixed.advance(1_000);
    expect(getClock().nowMs()).toBe(Date.parse("2026-07-16T15:00:01.000Z"));
  });

  it("IdGenerator is deterministic in tests", () => {
    setIdGenerator(new SequentialIdGenerator("t"));
    expect(getIdGenerator().generate()).toBe("t-00000001");
    expect(getIdGenerator().generate()).toBe("t-00000002");
  });

  it("HashPort exposes sha256 and perceptual", () => {
    const h = getHashPort();
    expect(h.sha256("abc")).toHaveLength(64);
    expect(h.perceptual(Buffer.from("abc"))).toHaveLength(16);
  });
});
