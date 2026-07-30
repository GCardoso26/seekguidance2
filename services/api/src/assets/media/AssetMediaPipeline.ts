import { createLogger } from "../../platform/logging/logger.js";
import { getHashPort } from "../../shared/hash/HashPort.js";
import type { AssetMetadata } from "../domain/types.js";
import type { MediaType } from "../domain/mediaTypes.js";
import { getObjectStorage } from "../storage/ObjectStoragePort.js";
import { downloadAssetBytes } from "./downloadAssetBytes.js";
import { optimizeImage, type OptimizedDerivative } from "./optimizeImage.js";

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
 * Pipeline V3 (ADR-017): virus scan → download → SHA256 → resize/encode → upload → CDN próprio.
 *
 * Sem object storage configurado (dev, CI, produção antes do corte) o pipeline mantém a
 * URL de origem e **não** publica derivadas: URL derivada só existe se o objeto existe.
 */
export class AssetMediaPipeline {
  async process(input: AssetPipelineInput): Promise<AssetPipelineOutput> {
    await this.virusScan(input.sourceUrl);
    const downloaded = await downloadAssetBytes(input.sourceUrl);
    const bytes = downloaded.bytes;
    const sha256 = getHashPort().sha256(bytes);

    const storage = getObjectStorage();
    const publicBase = process.env.PRODUCT_CATALOG_R2_PUBLIC_BASE?.replace(/\/$/, "");
    const uploadEnabled = storage.enabled && Boolean(publicBase);

    const optimized = uploadEnabled
      ? await optimizeImage(bytes)
      : { derivatives: [] as OptimizedDerivative[], optimized: false, width: undefined, height: undefined, format: undefined };

    const mime = mimeFromFormat(optimized.format) ?? sniffMime(bytes);
    const prefix = `assets/${sha256.slice(0, 2)}/${sha256}`;
    const originalKey = `${prefix}/original${extensionFor(mime)}`;

    const publishedDerivatives: Record<string, { url: string; mime: string; width: number; height: number }> =
      {};
    let uploadedBytes = 0;

    if (uploadEnabled) {
      await storage.put({ key: originalKey, body: bytes, contentType: mime ?? "application/octet-stream" });
      uploadedBytes += bytes.byteLength;
      for (const d of optimized.derivatives) {
        const key = `${prefix}/${d.size}.${d.format}`;
        await storage.put({ key, body: d.bytes, contentType: d.mime });
        uploadedBytes += d.bytes.byteLength;
        publishedDerivatives[`${d.size}.${d.format}`] = {
          url: `${publicBase}/${key}`,
          mime: d.mime,
          width: d.width,
          height: d.height,
        };
      }
    }

    const cdnUrl = uploadEnabled
      ? `${publicBase}/${originalKey}`
      : downloaded.fromFixture
        ? // Prefer real source URL over opaque fixture:// (Next/Image rejects fixture scheme).
          downloaded.finalUrl || `fixture://assets/${sha256}.png`
        : downloaded.finalUrl;

    const blurhash =
      process.env.ASSET_PIPELINE_BLURHASH === "1" ? placeholderBlurhash(sha256) : undefined;
    const lqip = buildLqipDataUrl(sha256, mime);
    const dominantColor = dominantFromHash(sha256);
    const palette = paletteFromHash(sha256);
    const width = optimized.width ?? input.metadata?.width;
    const height = optimized.height ?? input.metadata?.height;

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
      aspectRatio: width && height ? Math.round((width / height) * 1000) / 1000 : undefined,
      width,
      height,
    };

    // Só entra aqui o que foi realmente enviado. Nada de sufixo concatenado sobre host de terceiro.
    const derivatives: Record<string, unknown> = {
      ...publishedDerivatives,
      ...(uploadEnabled ? { original: { url: cdnUrl, mime, width, height } } : {}),
      _meta: metadata,
      _pipeline: uploadEnabled ? "asset-pipeline-v3-r2" : "asset-pipeline-v3-passthrough",
      _storage: storage.id,
    };

    log.info(
      {
        requestId: input.requestId,
        sha256,
        providerId: input.providerId,
        mediaType: metadata.mediaType,
        fromFixture: downloaded.fromFixture,
        attempts: downloaded.attempts,
        uploaded: uploadEnabled,
        derivativeCount: Object.keys(publishedDerivatives).length,
        uploadedBytes,
      },
      "asset_pipeline_v3_ok",
    );

    return {
      sha256,
      storageKey: uploadEnabled ? originalKey : undefined,
      cdnUrl,
      mime,
      sizeBytes: bytes.byteLength,
      blurhash,
      width,
      height,
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

function mimeFromFormat(format?: string): string | undefined {
  if (!format) return undefined;
  if (format === "jpg" || format === "jpeg") return "image/jpeg";
  if (format === "svg") return "image/svg+xml";
  return `image/${format}`;
}

function extensionFor(mime?: string): string {
  switch (mime) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    case "image/avif":
      return ".avif";
    case "image/gif":
      return ".gif";
    case "image/svg+xml":
      return ".svg";
    default:
      return ".bin";
  }
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
