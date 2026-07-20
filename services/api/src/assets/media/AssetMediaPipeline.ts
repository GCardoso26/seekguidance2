import { createLogger } from "../../platform/logging/logger.js";
import { getHashPort } from "../../shared/hash/HashPort.js";

const log = createLogger("assets.pipeline");

export interface AssetPipelineInput {
  sourceUrl: string;
  requestId: string;
  providerId?: string;
}

export interface AssetPipelineOutput {
  sha256: string;
  storageKey?: string;
  cdnUrl: string;
  width?: number;
  height?: number;
  mime?: string;
  sizeBytes?: number;
  blurhash?: string;
  derivatives: Record<string, { url?: string; mime?: string }>;
}

/**
 * Pipeline: virus scan → download → SHA256 → resize/WebP/AVIF/thumbnail/blurhash → CDN/R2.
 * Fases pesadas (sharp) ficam atrás de flags até deploy de workers dedicados.
 */
export class AssetMediaPipeline {
  async process(input: AssetPipelineInput): Promise<AssetPipelineOutput> {
    await this.virusScan(input.sourceUrl);
    const bytes = await this.download(input.sourceUrl);
    const sha256 = getHashPort().sha256(bytes);
    const mime = sniffMime(bytes);

    const publicBase = process.env.PRODUCT_CATALOG_R2_PUBLIC_BASE?.replace(/\/$/, "");
    const storageKey = `assets/${sha256.slice(0, 2)}/${sha256}`;
    const cdnUrl = publicBase ? `${publicBase}/${storageKey}` : input.sourceUrl;

    const derivatives: AssetPipelineOutput["derivatives"] = {};
    const { buildDerivativeSet } = await import("../cdn/derivativeUrls.js");
    const set = buildDerivativeSet(cdnUrl);
    derivatives.webp = { url: `${set.medium}`, mime: "image/webp" };
    derivatives.avif = { url: `${set.medium.replace(/\.webp$/i, ".avif")}`, mime: "image/avif" };
    derivatives.thumbnail = { url: set.thumb, mime: "image/webp" };
    derivatives.small = { url: set.small };
    derivatives.large = { url: set.large };
    derivatives.original = { url: set.original };

    const blurhash = process.env.ASSET_PIPELINE_BLURHASH === "1" ? placeholderBlurhash(sha256) : undefined;

    log.info({ requestId: input.requestId, sha256, providerId: input.providerId }, "asset_pipeline_ok");

    return {
      sha256,
      storageKey,
      cdnUrl,
      mime,
      sizeBytes: bytes.byteLength,
      blurhash,
      derivatives,
    };
  }

  private async virusScan(url: string): Promise<void> {
    if (process.env.ASSET_VIRUS_SCAN_URL) {
      const res = await fetch(process.env.ASSET_VIRUS_SCAN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error(`virus_scan_failed:${res.status}`);
    }
  }

  private async download(url: string): Promise<Buffer> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`asset_download_${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
}

function sniffMime(buf: Buffer): string | undefined {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50) return "image/png";
  if (buf.length >= 4 && buf.toString("ascii", 0, 4) === "RIFF") return "image/webp";
  return undefined;
}

function placeholderBlurhash(seed: string): string {
  return `L${seed.slice(0, 6)}00`;
}

export const assetMediaPipeline = new AssetMediaPipeline();
