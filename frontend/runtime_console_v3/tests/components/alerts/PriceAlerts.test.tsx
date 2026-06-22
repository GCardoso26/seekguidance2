/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import type { CreatePriceAlertInput } from "@/types/alert";

describe("CreatePriceAlertInput", () => {
  it("aceita payload mínimo", () => {
    const input: CreatePriceAlertInput = {
      card_id: "abc",
      target_price: 10.5,
      condition: "below",
    };
    expect(input.condition).toBe("below");
  });
});
