import { afterEach, describe, expect, it, vi } from "vitest";
import { AssetMediaPipeline } from "../AssetMediaPipeline.js";
import {
  resetObjectStorage,
  setObjectStorage,
  type ObjectStoragePort,
  type PutObjectInput,
} from "../../storage/ObjectStoragePort.js";

const PUBLIC_BASE = "https://cdn.judgetcg.test";

function fakeStorage(puts: PutObjectInput[]): ObjectStoragePort {
  return {
    id: "fake",
    enabled: true,
    async put(input) {
      puts.push(input);
    },
    async exists() {
      return false;
    },
  };
}

async function pngOf(width: number, height: number): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  return sharp({
    create: { width, height, channels: 3, background: { r: 200, g: 30, b: 90 } },
  })
    .png()
    .toBuffer();
}

describe("AssetMediaPipeline com object storage", () => {
  afterEach(() => {
    resetObjectStorage();
    delete process.env.PRODUCT_CATALOG_R2_PUBLIC_BASE;
    vi.unstubAllGlobals();
  });

  it("sobe original e derivadas, e só publica URL de objeto enviado", async () => {
    const source = await pngOf(1400, 1400);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(source, { status: 200 })),
    );
    process.env.PRODUCT_CATALOG_R2_PUBLIC_BASE = PUBLIC_BASE;
    const puts: PutObjectInput[] = [];
    setObjectStorage(fakeStorage(puts));

    const out = await new AssetMediaPipeline().process({
      sourceUrl: "https://images.example.com/box.png",
      requestId: "req-1",
      providerId: "tcgcsv-sealed",
    });

    expect(out.storageKey).toBe(`assets/${out.sha256.slice(0, 2)}/${out.sha256}/original.png`);
    expect(out.cdnUrl).toBe(`${PUBLIC_BASE}/${out.storageKey}`);
    expect(out.width).toBe(1400);
    expect(out.height).toBe(1400);

    const publishedKeys = puts.map((p) => p.key);
    expect(publishedKeys).toContain(out.storageKey);
    expect(publishedKeys.some((k) => k.endsWith("large.avif"))).toBe(true);
    expect(publishedKeys.some((k) => k.endsWith("large.webp"))).toBe(true);

    const derivativeUrls = Object.entries(out.derivatives)
      .filter(([k]) => !k.startsWith("_"))
      .map(([, v]) => (v as { url: string }).url);
    expect(derivativeUrls.length).toBeGreaterThan(1);
    for (const url of derivativeUrls) {
      expect(url.startsWith(`${PUBLIC_BASE}/`)).toBe(true);
      const key = url.slice(PUBLIC_BASE.length + 1);
      expect(publishedKeys).toContain(key);
    }
  }, 30_000);

  it("não faz upscale: fonte pequena não gera derivada grande", async () => {
    const source = await pngOf(200, 200);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(source, { status: 200 })),
    );
    process.env.PRODUCT_CATALOG_R2_PUBLIC_BASE = PUBLIC_BASE;
    const puts: PutObjectInput[] = [];
    setObjectStorage(fakeStorage(puts));

    await new AssetMediaPipeline().process({
      sourceUrl: "https://images.example.com/small.png",
      requestId: "req-2",
    });

    expect(puts.some((p) => p.key.includes("large."))).toBe(false);
    expect(puts.some((p) => p.key.includes("square."))).toBe(false);
  }, 30_000);
});
