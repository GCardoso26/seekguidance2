import { describe, expect, it } from "vitest";
import {
  classifySealedSubcategory,
  isSealedTcgCsvProduct,
  TCGCSV_CATEGORY_BY_GAME,
} from "../TcgCsvSealedProvider.js";
import { inferSourceType } from "../../../application/SourceTrust.js";

describe("TcgCsvSealedProvider helpers", () => {
  it("maps validated games and excludes ADR-016 denylist", () => {
    expect(TCGCSV_CATEGORY_BY_GAME.LORCANA).toBe(71);
    expect(TCGCSV_CATEGORY_BY_GAME.POKEMON).toBe(3);
    expect(TCGCSV_CATEGORY_BY_GAME.GUNDAM).toBe(86);
    expect(TCGCSV_CATEGORY_BY_GAME.SWU).toBeUndefined();
  });

  it("classifies sealed product names", () => {
    expect(classifySealedSubcategory("elite trainer box scarlet")).toBe("ELITE_TRAINER_BOX");
    expect(classifySealedSubcategory("booster pack")).toBe("BOOSTER_PACK");
    expect(classifySealedSubcategory("booster box display")).toBe("BOOSTER_BOX");
    expect(classifySealedSubcategory("starter deck 31")).toBe("STARTER_DECK");
  });

  it("filters singles out of sealed keyword check", () => {
    expect(isSealedTcgCsvProduct("Charizard ex #223")).toBe(false);
    expect(isSealedTcgCsvProduct("Booster Box — Scarlet")).toBe(true);
  });

  it("assigns distributor_feed trust to tcgcsv-sealed", () => {
    expect(inferSourceType("tcgcsv-sealed")).toBe("distributor_feed");
    expect(inferSourceType("lorcana-json-sealed")).toBe("publisher_api");
  });
});
