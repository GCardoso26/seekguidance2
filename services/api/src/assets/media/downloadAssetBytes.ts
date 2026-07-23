/**
 * Asset download helpers — URL resolution, retries, placeholder fixtures.
 * Stabilization only: no new BC; used by AssetMediaPipeline.
 */
export type FetchLike = (
  input: string,
  init?: RequestInit,
) => Promise<Response>;

const DEFAULT_UA =
  "JudgeTCG-AssetPipeline/1.0 (+https://judgetcg.com.br; catalog-assets)";

export function isPlaceholderAssetHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === "localhost" ||
    h.endsWith(".example") ||
    h.endsWith(".invalid") ||
    h.endsWith(".test") ||
    h === "cdn.judgetcg.example"
  );
}

export type PlaceholderMode = "fixture" | "skip" | "fail";

export function placeholderModeFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): PlaceholderMode {
  const raw = (env.ASSET_PIPELINE_PLACEHOLDER_MODE ?? "fixture").toLowerCase();
  if (raw === "skip" || raw === "fail" || raw === "fixture") return raw;
  return "fixture";
}

/** Rewrite placeholder CDN host to real public base when configured. */
export function resolveAssetSourceUrl(
  sourceUrl: string,
  env: NodeJS.ProcessEnv = process.env,
): string {
  let parsed: URL;
  try {
    parsed = new URL(sourceUrl);
  } catch {
    throw new Error(`invalid_source_url:${sourceUrl.slice(0, 80)}`);
  }

  if (!isPlaceholderAssetHost(parsed.hostname)) return sourceUrl;

  const base = (
    env.MANUFACTURER_ASSET_CDN_BASE ??
    env.PRODUCT_CATALOG_R2_PUBLIC_BASE ??
    ""
  ).replace(/\/$/, "");

  if (base) {
    return `${base}${parsed.pathname}${parsed.search}`;
  }
  return sourceUrl;
}

/**
 * Minimal valid 1×1 PNG — RGB derived from seed so each URL gets a distinct sha256.
 */
export function buildFixturePng(seed: string): Buffer {
  const hash = simpleHash(seed);
  const r = hash & 0xff;
  const g = (hash >>> 8) & 0xff;
  const b = (hash >>> 16) & 0xff;
  return buildPngWithTextChunk(r, g, b, seed.slice(0, 48));
}

function buildPngWithTextChunk(r: number, g: number, b: number, text: string): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(1, 0);
  ihdrData.writeUInt32BE(1, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // RGB
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdr = pngChunk("IHDR", ihdrData);

  // Uncompressed IDAT via zlib stored block is complex; use filter+raw via fixed zlib for RGB pixel.
  // zlib header 78 01 + stored block with 1 filter byte + 3 RGB
  const raw = Buffer.from([0x00, r & 0xff, g & 0xff, b & 0xff]); // filter None + RGB
  const idatPayload = zlibStore(raw);
  const idat = pngChunk("IDAT", idatPayload);

  const keyword = "Comment";
  const textData = Buffer.concat([
    Buffer.from(keyword, "ascii"),
    Buffer.from([0]),
    Buffer.from(text, "utf8"),
  ]);
  const textChunk = pngChunk("tEXt", textData);
  const iend = pngChunk("IEND", Buffer.alloc(0));
  return Buffer.concat([signature, ihdr, idat, textChunk, iend]);
}

function zlibStore(data: Buffer): Buffer {
  // CMF/FLG + stored block + adler32
  const len = data.length;
  const nlen = ~len & 0xffff;
  const block = Buffer.alloc(5 + len);
  block[0] = 0x01; // BFINAL + non-compressed
  block.writeUInt16LE(len, 1);
  block.writeUInt16LE(nlen, 3);
  data.copy(block, 5);
  const adler = adler32(data);
  const out = Buffer.alloc(2 + block.length + 4);
  out[0] = 0x78;
  out[1] = 0x01;
  block.copy(out, 2);
  out.writeUInt32BE(adler >>> 0, 2 + block.length);
  return out;
}

function adler32(buf: Buffer): number {
  let a = 1;
  let b = 0;
  for (let i = 0; i < buf.length; i++) {
    a = (a + buf[i]!) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])) >>> 0, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]!;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function simpleHash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface DownloadAssetOptions {
  fetchImpl?: FetchLike;
  timeoutMs?: number;
  maxAttempts?: number;
  env?: NodeJS.ProcessEnv;
  userAgent?: string;
}

export interface DownloadAssetResult {
  bytes: Buffer;
  finalUrl: string;
  fromFixture: boolean;
  attempts: number;
}

export async function downloadAssetBytes(
  sourceUrl: string,
  opts: DownloadAssetOptions = {},
): Promise<DownloadAssetResult> {
  const env = opts.env ?? process.env;
  const fetchImpl = opts.fetchImpl ?? fetch;
  const timeoutMs = opts.timeoutMs ?? Number(env.ASSET_PIPELINE_TIMEOUT_MS ?? 15_000);
  const maxAttempts = opts.maxAttempts ?? Number(env.ASSET_PIPELINE_MAX_ATTEMPTS ?? 3);
  const ua = opts.userAgent ?? DEFAULT_UA;

  const resolved = resolveAssetSourceUrl(sourceUrl, env);
  let hostname: string;
  try {
    hostname = new URL(resolved).hostname;
  } catch {
    throw new Error(`invalid_source_url:${resolved.slice(0, 80)}`);
  }

  if (isPlaceholderAssetHost(hostname)) {
    const mode = placeholderModeFromEnv(env);
    if (mode === "skip") {
      throw new Error(`placeholder_url_skipped:${hostname}`);
    }
    if (mode === "fixture") {
      return {
        bytes: buildFixturePng(resolved),
        finalUrl: resolved,
        fromFixture: true,
        attempts: 0,
      };
    }
    // mode === fail → fall through to network fetch (will ENOTFOUND)
  }

  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetchImpl(resolved, {
        redirect: "follow",
        headers: {
          Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
          "User-Agent": ua,
        },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) {
        throw new Error(`asset_download_${res.status}`);
      }
      const bytes = Buffer.from(await res.arrayBuffer());
      if (bytes.length === 0) throw new Error("asset_download_empty");
      return { bytes, finalUrl: resolved, fromFixture: false, attempts: attempt };
    } catch (e) {
      lastErr = e;
      const msg = e instanceof Error ? e.message : String(e);
      const retryable =
        /fetch failed|timeout|ECONNRESET|ETIMEDOUT|ENOTFOUND|EAI_AGAIN|503|502|429/i.test(
          msg,
        ) ||
        (e instanceof Error &&
          "cause" in e &&
          /ENOTFOUND|ETIMEDOUT|ECONNRESET/i.test(
            String((e as { cause?: { code?: string } }).cause?.code ?? ""),
          ));
      if (!retryable || attempt >= maxAttempts) break;
      await sleep(200 * attempt);
    }
  }

  const cause =
    lastErr instanceof Error && "cause" in lastErr
      ? (lastErr as { cause?: { code?: string } }).cause?.code
      : undefined;
  const baseMsg = lastErr instanceof Error ? lastErr.message : String(lastErr);
  throw new Error(
    `fetch failed${cause ? `:${cause}` : ""}:${baseMsg}:${resolved.slice(0, 120)}`,
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
