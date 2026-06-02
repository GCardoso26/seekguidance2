import { describe, expect, it } from "vitest";
import { THEME_CONTRAST_RATIOS } from "@/styles/tcg-theme";
import { meetsWcagAA } from "@/lib/wcag-contrast";

describe("WCAG contrast — temas Judge TCG", () => {
  Object.entries(THEME_CONTRAST_RATIOS).forEach(([game, ratio]) => {
    it(`${game} cumpre AA (≥4.5) entre texto e superfície`, () => {
      expect(meetsWcagAA(ratio)).toBe(true);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });
});
