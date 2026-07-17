import { describe, expect, it } from "vitest";
import { createCatalogProvider, listCatalogProviderKeys } from "../../factory.js";
import { clearLorcanaDatasetCache, getCardById, listCardsBySet } from "../DatasetLoader.js";
import { LorcanaProvider } from "../LorcanaProvider.js";
import { displayName, mapCard } from "../MetadataMapper.js";

describe("LorcanaProvider", () => {
  it("está registrado na factory beachhead", () => {
    expect(listCatalogProviderKeys()).toContain("LORCANA:lorcana-dataset");
    const p = createCatalogProvider("LORCANA", "lorcana-dataset");
    expect(p).toBeInstanceOf(LorcanaProvider);
    expect(p.gameCode).toBe("LORCANA");
    expect(p.providerId).toBe("lorcana-dataset");
    expect(p.capabilities.prices).toBe(false);
  });

  it("syncSets retorna sets do dataset", async () => {
    clearLorcanaDatasetCache();
    const p = new LorcanaProvider();
    const res = await p.syncSets({ requestId: "t1", mode: "SHADOW" });
    expect(res.ok).toBe(true);
    expect(res.count).toBeGreaterThanOrEqual(1);
    expect(res.items?.some((s) => s.code === "TFC")).toBe(true);
  });

  it("syncCards filtra por set e mapeia display name com version", async () => {
    const p = new LorcanaProvider();
    const res = await p.syncCards({ requestId: "t2", mode: "LIVE" }, "TFC");
    expect(res.ok).toBe(true);
    expect(res.count).toBeGreaterThanOrEqual(1);
    const rapunzel = res.items?.find((c) => c.providerCardId === "lor_rapunzel_gifted");
    expect(rapunzel?.name).toBe("Rapunzel – Gifted with Healing");
    expect(rapunzel?.normalizedName).toContain("rapunzel");
  });

  it("syncVariants deriva finishes sem preço", async () => {
    const p = new LorcanaProvider();
    const res = await p.syncVariants({ requestId: "t3", mode: "LIVE" }, "lor_rapunzel_gifted");
    expect(res.ok).toBe(true);
    expect(res.count).toBeGreaterThanOrEqual(1);
    expect(res.items?.every((v) => v.providerVariantId.includes("lor_rapunzel_gifted"))).toBe(true);
  });

  it("syncImages enfileira job DTO com URL", async () => {
    const p = new LorcanaProvider();
    const res = await p.syncImages({ requestId: "t4", mode: "LIVE" }, "lor_be_prepared");
    expect(res.ok).toBe(true);
    expect(res.count).toBe(1);
    expect(res.items?.[0]?.sourceUrl).toBeTruthy();
    expect(res.items?.[0]?.provider).toBe("lorcana-dataset");
  });

  it("mode OFF é no-op", async () => {
    const p = new LorcanaProvider();
    const sets = await p.syncSets({ requestId: "off", mode: "OFF" });
    expect(sets.count).toBe(0);
  });

  it("loader encontra carta da watchlist", () => {
    const card = getCardById("lor_diablo_devoted");
    expect(card).toBeDefined();
    expect(displayName(card!)).toBe("Diablo – Devoted Herald");
    expect(listCardsBySet("ROF").length).toBeGreaterThanOrEqual(1);
    const dto = mapCard(card!);
    expect(dto.gameData?.ink).toBe("Amethyst");
  });
});
