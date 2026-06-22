import { describe, expect, it } from "vitest";
import { parseDeckList } from "@/lib/deck-parser";
import { formatValidationErrors } from "@/lib/deck-validation";

describe("deck-parser", () => {
  it("parses quantity and name", () => {
    const items = parseDeckList("4 Lightning Bolt\n2 Counterspell");
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ quantity: 4, name: "Lightning Bolt", isSideboard: false });
  });

  it("parses sideboard prefix", () => {
    const items = parseDeckList("SB: 3 Pyroblast");
    expect(items[0]).toMatchObject({ quantity: 3, name: "Pyroblast", isSideboard: true });
  });
});

describe("deck-validation helpers", () => {
  it("merges warnings into formatted errors list", () => {
    expect(formatValidationErrors(["Erro A"], ["Aviso B"])).toEqual(["Erro A", "Aviso B"]);
  });
});
