import { describe, expect, it, vi } from "vitest";
import {
  buildFixturePng,
  downloadAssetBytes,
  isPlaceholderAssetHost,
  resolveAssetSourceUrl,
} from "../downloadAssetBytes.js";
import { assetMediaPipeline } from "../AssetMediaPipeline.js";

describe("downloadAssetBytes", () => {
  it("detects placeholder hosts", () => {
    expect(isPlaceholderAssetHost("cdn.judgetcg.example")).toBe(true);
    expect(isPlaceholderAssetHost("images.example")).toBe(true);
    expect(isPlaceholderAssetHost("cdn.cloudflare.com")).toBe(false);
  });

  it("rewrites placeholder URL when CDN base is set", () => {
    const url = resolveAssetSourceUrl(
      "https://cdn.judgetcg.example/manufacturers/gamegenic/sleeves-packshot.webp",
      { MANUFACTURER_ASSET_CDN_BASE: "https://assets.judgetcg.com.br" },
    );
    expect(url).toBe(
      "https://assets.judgetcg.com.br/manufacturers/gamegenic/sleeves-packshot.webp",
    );
  });

  it("uses deterministic fixture for .example without CDN (default mode)", async () => {
    const a = await downloadAssetBytes(
      "https://cdn.judgetcg.example/manufacturers/gamegenic/sleeves-packshot.webp",
      { env: { ASSET_PIPELINE_PLACEHOLDER_MODE: "fixture" } },
    );
    const b = await downloadAssetBytes(
      "https://cdn.judgetcg.example/manufacturers/gamegenic/sleeves-hero.webp",
      { env: { ASSET_PIPELINE_PLACEHOLDER_MODE: "fixture" } },
    );
    expect(a.fromFixture).toBe(true);
    expect(a.bytes.length).toBeGreaterThan(40);
    expect(a.bytes[0]).toBe(0x89);
    expect(Buffer.compare(a.bytes, b.bytes)).not.toBe(0);
  });

  it("skips placeholder when mode=skip", async () => {
    await expect(
      downloadAssetBytes("https://cdn.judgetcg.example/x.webp", {
        env: { ASSET_PIPELINE_PLACEHOLDER_MODE: "skip" },
      }),
    ).rejects.toThrow(/placeholder_url_skipped/);
  });

  it("retries then surfaces 404", async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 404 }));
    await expect(
      downloadAssetBytes("https://cdn.example.com/missing.webp", {
        fetchImpl: fetchImpl as unknown as typeof fetch,
        env: { ASSET_PIPELINE_PLACEHOLDER_MODE: "fail", ASSET_PIPELINE_MAX_ATTEMPTS: "2" },
        maxAttempts: 2,
      }),
    ).rejects.toThrow(/asset_download_404/);
    expect(fetchImpl).toHaveBeenCalled();
  });

  it("retries on 503 for real host then succeeds", async () => {
    let n = 0;
    const png = buildFixturePng("retry-ok");
    const fetchImpl = vi.fn(async () => {
      n += 1;
      if (n < 2) return new Response("busy", { status: 503 });
      return new Response(png, { status: 200 });
    });
    const res = await downloadAssetBytes("https://images.cloudflare.com/a.webp", {
      fetchImpl: fetchImpl as unknown as typeof fetch,
      maxAttempts: 3,
      timeoutMs: 5000,
    });
    expect(res.fromFixture).toBe(false);
    expect(res.attempts).toBe(2);
    expect(Buffer.compare(res.bytes, png)).toBe(0);
  });

  it("handles timeout via abort", async () => {
    const fetchImpl = vi.fn(async (_u: string, init?: RequestInit) => {
      const signal = init?.signal;
      await new Promise<void>((_resolve, reject) => {
        const t = setTimeout(() => reject(new Error("should_abort")), 5000);
        signal?.addEventListener("abort", () => {
          clearTimeout(t);
          reject(Object.assign(new Error("The operation was aborted"), { name: "TimeoutError" }));
        });
      });
      return new Response(null);
    });
    await expect(
      downloadAssetBytes("https://images.cloudflare.com/slow.webp", {
        fetchImpl: fetchImpl as unknown as typeof fetch,
        timeoutMs: 50,
        maxAttempts: 1,
      }),
    ).rejects.toThrow(/fetch failed/);
  });

  it("pipeline process succeeds for manufacturer placeholder URL", async () => {
    const out = await assetMediaPipeline.process({
      sourceUrl: "https://cdn.judgetcg.example/manufacturers/gamegenic/sleeves-packshot.webp",
      requestId: "test-req",
      providerId: "gamegenic",
    });
    expect(out.sha256).toHaveLength(64);
    expect(out.mime).toBe("image/png");
    expect(out.cdnUrl).toMatch(/^fixture:\/\//);
  });
});
