/**
 * Otimização de imagem com sharp (ADR-017): 4 resoluções de produto em AVIF e WebP,
 * mais o original preservado como fonte de regeneração. Nunca faz upscale.
 *
 * sharp é binário nativo. Se não carregar (imagem Docker sem a dependência), o
 * pipeline degrada para "só o original" em vez de derrubar a ingestão.
 */
import { createLogger } from "../../platform/logging/logger.js";
import { PRODUCT_IMAGE_SIZES } from "../domain/imageSizes.js";

const log = createLogger("assets.optimizer");

export type DerivativeFormat = "avif" | "webp";

export interface OptimizedDerivative {
  /** thumb | medium | square | large */
  size: string;
  format: DerivativeFormat;
  width: number;
  height: number;
  bytes: Buffer;
  mime: string;
}

export interface OptimizedImage {
  width?: number;
  height?: number;
  format?: string;
  derivatives: OptimizedDerivative[];
  /** False quando sharp não está disponível: só o original é preservado. */
  optimized: boolean;
}

const FORMATS: DerivativeFormat[] = ["avif", "webp"];

type SharpFactory = (typeof import("sharp"))["default"];

let sharpPromise: Promise<SharpFactory | null> | undefined;

async function loadSharp(): Promise<SharpFactory | null> {
  sharpPromise ??= import("sharp").then(
    (m) => m.default,
    (err: unknown) => {
      log.warn({ err: err instanceof Error ? err.message : String(err) }, "sharp_unavailable");
      return null;
    },
  );
  return sharpPromise;
}

export async function optimizeImage(source: Buffer): Promise<OptimizedImage> {
  const sharp = await loadSharp();
  if (!sharp) return { derivatives: [], optimized: false };

  let meta: { width?: number; height?: number; format?: string };
  try {
    meta = await sharp(source).metadata();
  } catch (err) {
    log.warn(
      { err: err instanceof Error ? err.message : String(err) },
      "image_metadata_unreadable",
    );
    return { derivatives: [], optimized: false };
  }

  const derivatives: OptimizedDerivative[] = [];
  const sourceWidth = meta.width ?? 0;

  for (const [size, preset] of Object.entries(PRODUCT_IMAGE_SIZES)) {
    // Nunca faz upscale: gerar 1200px a partir de um 400px só inventa bytes.
    if (sourceWidth && preset.width > sourceWidth) continue;
    for (const format of FORMATS) {
      try {
        const pipeline = sharp(source)
          .rotate()
          .resize({ width: preset.width, height: preset.height, fit: "inside", withoutEnlargement: true });
        const encoded =
          format === "avif"
            ? await pipeline.avif({ quality: 55 }).toBuffer({ resolveWithObject: true })
            : await pipeline.webp({ quality: 80 }).toBuffer({ resolveWithObject: true });
        derivatives.push({
          size,
          format,
          width: encoded.info.width,
          height: encoded.info.height,
          bytes: encoded.data,
          mime: `image/${format}`,
        });
      } catch (err) {
        log.warn(
          { size, format, err: err instanceof Error ? err.message : String(err) },
          "image_derivative_failed",
        );
      }
    }
  }

  return {
    width: meta.width,
    height: meta.height,
    format: meta.format,
    derivatives,
    optimized: true,
  };
}
