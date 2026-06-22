/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { LEVEL_ORDER, nextLevelLabel } from "@/types/gamification";

describe("Liga Pass types", () => {
  it("nextLevelLabel avança corretamente", () => {
    expect(nextLevelLabel("bronze")).toBe("Prata");
    expect(nextLevelLabel("silver")).toBe("Ouro");
    expect(nextLevelLabel("judge")).toBe("Máximo");
  });

  it("LEVEL_ORDER tem 5 níveis", () => {
    expect(LEVEL_ORDER).toHaveLength(5);
    expect(LEVEL_ORDER[0]).toBe("bronze");
  });
});
