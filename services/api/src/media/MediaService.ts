import { createHash } from "node:crypto";
import { createLogger } from "../platform/logging/logger.js";
import { createDomainEvent } from "../shared/events/types.js";
import { eventBus } from "../platform/event-bus/EventBus.js";

const log = createLogger("media");

export interface MediaProcessInput {
  ownerType: string;
  ownerId: string;
  sourceUrl: string;
  provider?: string;
  requestId: string;
}

export interface MediaAssetRecord {
  sha256: string;
  perceptualHash: string;
  mime?: string;
  filesize?: number;
  reused: boolean;
  storageKey?: string;
}

/**
 * Phase 1 Media skeleton:
 * - SHA-256 dedup
 * - perceptual hash placeholder (real pHash in Phase 3 with sharp)
 * - no R2 upload yet (interface ready)
 */
export class MediaService {
  private bySha = new Map<string, MediaAssetRecord>();
  private byPhash = new Map<string, MediaAssetRecord>();

  async process(input: MediaProcessInput): Promise<MediaAssetRecord> {
    // Virus scan hook (no-op in Phase 1 / pluggable later)
    await this.virusScan(input.sourceUrl);

    const bytes = await this.download(input.sourceUrl);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const perceptualHash = simplePerceptualHash(bytes);

    const existing = this.bySha.get(sha256) ?? this.findNearDuplicate(perceptualHash);
    if (existing) {
      log.info(
        { requestId: input.requestId, sha256, reused: true },
        "media_dedup_hit",
      );
      await eventBus.publish(
        createDomainEvent(
          "MediaUpdated",
          input.ownerId,
          { ownerType: input.ownerType, reused: true, sha256 },
          { requestId: input.requestId, aggregateType: "media_asset", correlationId: input.requestId },
        ),
      );
      return { ...existing, reused: true };
    }

    // Resize + upload happen in Phase 3
    const record: MediaAssetRecord = {
      sha256,
      perceptualHash,
      filesize: bytes.byteLength,
      mime: sniffMime(bytes),
      reused: false,
      storageKey: `pending/${sha256}`,
    };
    this.bySha.set(sha256, record);
    this.byPhash.set(perceptualHash, record);

    await eventBus.publish(
      createDomainEvent(
        "MediaUpdated",
        input.ownerId,
        { ownerType: input.ownerType, reused: false, sha256 },
        { requestId: input.requestId, aggregateType: "media_asset", correlationId: input.requestId },
      ),
    );

    return record;
  }

  private findNearDuplicate(phash: string): MediaAssetRecord | undefined {
    // Phase 1: exact pHash match only; Hamming distance in Phase 3
    return this.byPhash.get(phash);
  }

  private async virusScan(_url: string): Promise<void> {
    // Interface reserved — fail closed when scanner enabled
  }

  private async download(url: string): Promise<Buffer> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`media_download_${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
}

/** Lightweight placeholder until sharp + blockhash in Phase 3. */
export function simplePerceptualHash(buf: Buffer): string {
  const sample = buf.subarray(0, Math.min(buf.length, 4096));
  return createHash("sha1").update(sample).digest("hex").slice(0, 16);
}

function sniffMime(buf: Buffer): string | undefined {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50) return "image/png";
  if (buf.length >= 4 && buf.toString("ascii", 0, 4) === "RIFF") return "image/webp";
  return undefined;
}

export const mediaService = new MediaService();
