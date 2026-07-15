import { describe, expect, it } from "vitest";
import { formatCountStable } from "@/lib/format-count";
import { MOCK_CATALOG_HEALTH } from "@/lib/catalog-games";

describe("formatCountStable", () => {
  it("agrupa milhares com ponto fixo", () => {
    expect(formatCountStable(34717)).toBe("34.717");
    expect(formatCountStable(0)).toBe("0");
    expect(formatCountStable(999)).toBe("999");
    expect(formatCountStable(1_234_567)).toBe("1.234.567");
  });
});

describe("MOCK_CATALOG_HEALTH", () => {
  it("tem last_sync e total_cards estáveis", () => {
    expect(MOCK_CATALOG_HEALTH.last_sync.MTG).toBe("2024-01-01T00:00:00.000Z");
    const sum = Object.values(MOCK_CATALOG_HEALTH.by_game).reduce((a, b) => a + (b ?? 0), 0);
    expect(MOCK_CATALOG_HEALTH.total_cards).toBe(sum);
  });
});
