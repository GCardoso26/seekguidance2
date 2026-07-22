import { describe, expect, it } from "vitest";
import {
  MEDIA_TYPES,
  CARD_IMAGE_SIZES,
  resolveCardAsset,
  resolveHdCardAsset,
  resolveExpansionAssets,
  resolveDeckCover,
} from "@/lib/assets";
import { buildSealedGallery } from "@/components/assets/AssetGallery";

describe("Asset Pipeline V2 — catalog", () => {
  it("lists all media types", () => {
    expect(MEDIA_TYPES).toContain("CARD");
    expect(MEDIA_TYPES).toContain("SET_BANNER");
    expect(MEDIA_TYPES).toContain("GAME_HERO");
    expect(MEDIA_TYPES).toContain("SEALED_GALLERY");
    expect(CARD_IMAGE_SIZES.medium).toEqual({ width: 420, height: 560 });
  });

  it("prefers HD and never picks small before large when large exists", () => {
    const uris = {
      small: "https://cdn/s.jpg",
      normal: "https://cdn/n.jpg",
      large: "https://cdn/l.jpg",
      full: "https://cdn/f.jpg",
    };
    const hd = resolveHdCardAsset(uris);
    expect(hd?.src).toBe("https://cdn/f.jpg");
    const medium = resolveCardAsset(uris, "medium");
    expect(medium?.src).toBe("https://cdn/n.jpg");
  });

  it("clamps when only small is available for large request", () => {
    const resolved = resolveCardAsset({ small: "https://cdn/s.jpg" }, "large");
    expect(resolved?.src).toBe("https://cdn/s.jpg");
    expect(resolved?.clamped).toBe(true);
  });

  it("builds sealed gallery with multiple shots", () => {
    const items = buildSealedGallery("https://cdn/box.webp");
    expect(items.length).toBeGreaterThan(1);
    expect(items.some((i) => i.shot === "front")).toBe(true);
    expect(items.some((i) => i.shot === "zoom")).toBe(true);
  });

  it("resolves expansion + deck cover packs", () => {
    const exp = resolveExpansionAssets({ gameLogo: "/logos/mtg.webp" });
    expect(exp.logo).toBe("/logos/mtg.webp");
    expect(exp.banner).toBeTruthy();
    const deck = resolveDeckCover(
      { customCover: "https://cdn/custom.jpg", autoFromCard: "https://cdn/auto.jpg" },
      "/logos/x.svg",
    );
    expect(deck.cover).toBe("https://cdn/custom.jpg");
  });
});

describe("Unified catalog media types", () => {
  it("maps category strings to CARD / SEALED / ACCESSORY", async () => {
    const { mediaTypeFromCategory, primaryProductImageUrl } = await import(
      "@/lib/assets/product-media-type"
    );
    expect(mediaTypeFromCategory("single")).toBe("CARD");
    expect(mediaTypeFromCategory("SEALED_PRODUCT")).toBe("SEALED_PRODUCT");
    expect(mediaTypeFromCategory("BOOSTER_BOX")).toBe("SEALED_PRODUCT");
    expect(mediaTypeFromCategory("SLEEVES")).toBe("ACCESSORY");
    expect(mediaTypeFromCategory("PLAYMAT")).toBe("ACCESSORY");
    expect(mediaTypeFromCategory("DECK_BOX")).toBe("ACCESSORY");
    expect(mediaTypeFromCategory("BOOSTER_BOX")).toBe("SEALED_PRODUCT");
    expect(primaryProductImageUrl(["", " https://cdn/a.webp "])).toBe("https://cdn/a.webp");
    expect(primaryProductImageUrl(null, "https://cdn/b.webp")).toBe("https://cdn/b.webp");
  });
});
