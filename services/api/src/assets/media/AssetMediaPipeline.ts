import { createLogger } from "../../platform/logging/logger.js";
import { getHashPort } from "../../shared/hash/HashPort.js";
import type { AssetMetadata } from "../domain/types.js";
import type { MediaType } from "../domain/mediaTypes.js";
import { downloadAssetBytes } from "./downloadAssetBytes.js";

const log = createLogger("assets.pipeline");

export interface AssetPipelineInput {
  sourceUrl: string;
  requestId: string;
  providerId?: string;
  mediaType?: MediaType;
  metadata?: Partial<AssetMetadata>;
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
  /** V2: size × format URLs + meta */
  derivatives: Record<string, unknown>;
  metadata: AssetMetadata;
}

/**
 * Pipeline V2: virus scan → download → SHA256 → derivative map (WebP/AVIF/JPEG) →
 * blur/LQIP/palette stubs → CDN key.
 * Heavy sharp encoding remains behind workers/flags; URLs + metadata are always emitted.
 */
export class AssetMediaPipeline {
  async process(input: AssetPipelineInput): Promise<AssetPipelineOutput> {
    await this.virusScan(input.sourceUrl);
    const downloaded = await downloadAssetBytes(input.sourceUrl);
    const bytes = downloaded.bytes;
    const sha256 = getHashPort().sha256(bytes);
    const mime = sniffMime(bytes);

    const publicBase = process.env.PRODUCT_CATALOG_R2_PUBLIC_BASE?.replace(/\/$/, "");
    const storageKey = `assets/${sha256.slice(0, 2)}/${sha256}`;
    const cdnUrl = publicBase
      ? `${publicBase}/${storageKey}.webp`
      : downloaded.fromFixture
        ? `fixture://assets/${sha256}.png`
        : downloaded.finalUrl;

    const { buildFormatDerivativeMap, buildDerivativeSet } = await import(
      "../cdn/derivativeUrls.js"
    );
    const sizeSet = buildDerivativeSet(cdnUrl);
    const formatMap = buildFormatDerivativeMap(cdnUrl);

    const blurhash =
      process.env.ASSET_PIPELINE_BLURHASH === "1" ? placeholderBlurhash(sha256) : undefined;
    const lqip = buildLqipDataUrl(sha256, mime);
    const dominantColor = dominantFromHash(sha256);
    const palette = paletteFromHash(sha256);

    const metadata: AssetMetadata = {
      alt: input.metadata?.alt,
      caption: input.metadata?.caption,
      copyright: input.metadata?.copyright,
      provider: input.metadata?.provider ?? input.providerId,
      source: input.metadata?.source ?? input.sourceUrl,
      license: input.metadata?.license,
      hash: sha256,
      checksum: sha256,
      mime,
      mediaType: input.mediaType ?? input.metadata?.mediaType,
      dominantColor,
      palette,
      lqip,
      aspectRatio: undefined,
      width: input.metadata?.width,
      height: input.metadata?.height,
    };

    const derivatives: Record<string, unknown> = {
      ...formatMap,
      webp: { url: sizeSet.medium, mime: "image/webp" },
      avif: { url: formatMap["medium.avif"]?.url, mime: "image/avif" },
      jpeg: { url: formatMap["medium.jpeg"]?.url, mime: "image/jpeg" },
      thumbnail: { url: sizeSet.thumb, mime: "image/webp" },
      small: { url: sizeSet.small },
      medium: { url: sizeSet.medium },
      large: { url: sizeSet.large },
      full: { url: sizeSet.full },
      original: { url: sizeSet.original },
      _meta: metadata,
      _pipeline: "asset-pipeline-v2",
    };

    log.info(
      {
        requestId: input.requestId,
        sha256,
        providerId: input.providerId,
        mediaType: metadata.mediaType,
        fromFixture: downloaded.fromFixture,
        attempts: downloaded.attempts,
      },
      "asset_pipeline_v2_ok",
    );

    return {
      sha256,
      storageKey,
      cdnUrl,
      mime,
      sizeBytes: bytes.byteLength,
      blurhash,
      width: metadata.width,
      height: metadata.height,
      derivatives,
      metadata,
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

function dominantFromHash(sha: string): string {
  return `#${sha.slice(0, 6)}`;
}

function paletteFromHash(sha: string): string[] {
  return [`#${sha.slice(0, 6)}`, `#${sha.slice(6, 12)}`, `#${sha.slice(12, 18)}`];
}

/** Tiny SVG LQIP — no original bytes shipped to clients. */
function buildLqipDataUrl(seed: string, mime?: string): string {
  const color = dominantFromHash(seed);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="22"><rect width="16" height="22" fill="${color}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}${mime ? "" : ""}`;
}

export const assetMediaPipeline = new AssetMediaPipeline();
