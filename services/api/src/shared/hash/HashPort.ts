import { createHash } from "node:crypto";

export type HashAlgorithm = "sha256" | "perceptual" | "xxhash" | "murmur" | "blake3";

/**
 * Hash port — encapsulate algorithms so Media/Catalog can swap SHA256 / pHash / BLAKE3 later.
 */
export interface HashPort {
  sha256(bytes: Buffer | Uint8Array | string): string;
  /** Placeholder until sharp + blockhash (Phase 3). */
  perceptual(bytes: Buffer | Uint8Array): string;
}

export class NodeHashPort implements HashPort {
  sha256(bytes: Buffer | Uint8Array | string): string {
    const data = typeof bytes === "string" ? Buffer.from(bytes) : Buffer.from(bytes);
    return createHash("sha256").update(data).digest("hex");
  }

  perceptual(bytes: Buffer | Uint8Array): string {
    const buf = Buffer.from(bytes);
    const sample = buf.subarray(0, Math.min(64, buf.length));
    return createHash("sha256").update(sample).digest("hex").slice(0, 16);
  }
}

let activeHash: HashPort = new NodeHashPort();

export function getHashPort(): HashPort {
  return activeHash;
}

export function setHashPort(port: HashPort): void {
  activeHash = port;
}

export function resetHashPort(): void {
  activeHash = new NodeHashPort();
}
