/**
 * Reprocessa os assets já persistidos para o object storage próprio (ADR-017).
 *
 * Ordem de corte obrigatória: rodar ISTO antes de ligar PRODUCT_CATALOG_R2_PUBLIC_BASE
 * em runtime. Enquanto o backfill não termina, `cdn_url` segue apontando para a origem.
 *
 *   npx tsx scripts/backfill-asset-storage.ts --limit 50            # amostra
 *   npx tsx scripts/backfill-asset-storage.ts --concurrency 4       # corrida completa
 *   npx tsx scripts/backfill-asset-storage.ts --only-hotlinked      # só o que aponta para terceiro
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createCatalogPgPool } from "../src/product-catalog/persistence/createCatalogPgPool.js";
import { downloadAssetBytes } from "../src/assets/media/downloadAssetBytes.js";
import { optimizeImage } from "../src/assets/media/optimizeImage.js";
import { bootstrapObjectStorage } from "../src/assets/storage/R2ObjectStorage.js";

const REPORT_PATH = ".tmp/asset-storage-backfill.json";

function loadEnvFile() {
  const p = resolve(process.cwd(), ".env");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!m || process.env[m[1]]) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[m[1]] = v;
  }
}

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const LIMIT = Number(argValue("--limit") ?? 0);
const CONCURRENCY = Number(argValue("--concurrency") ?? 4);
const ONLY_HOTLINKED = process.argv.includes("--only-hotlinked");

loadEnvFile();

const publicBase = process.env.PRODUCT_CATALOG_R2_PUBLIC_BASE?.replace(/\/$/, "");
const storage = bootstrapObjectStorage();

if (!storage.enabled) {
  console.error("Sem credenciais R2 (R2_ACCOUNT_ID/ACCESS_KEY_ID/SECRET_ACCESS_KEY/BUCKET).");
  process.exit(1);
}
if (!publicBase) {
  console.error("PRODUCT_CATALOG_R2_PUBLIC_BASE ausente: sem ela não há URL pública para gravar.");
  process.exit(1);
}

const pool = createCatalogPgPool({ max: Math.max(2, CONCURRENCY) });

type Row = { id: string; sha256: string; cdn_url: string | null; mime: string | null };

function extensionFor(mime?: string | null): string {
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
    default:
      return ".bin";
  }
}

function mimeFromFormat(format?: string): string | undefined {
  if (!format) return undefined;
  if (format === "jpg" || format === "jpeg") return "image/jpeg";
  return `image/${format}`;
}

async function mapLimit<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        await fn(items[cursor++]);
      }
    }),
  );
}

try {
  const { rows } = await pool.query<Row>(
    `
    SELECT id, sha256, cdn_url, mime
    FROM media.assets
    WHERE cdn_url IS NOT NULL
      AND cdn_url NOT LIKE $1 || '%'
      ${ONLY_HOTLINKED ? "AND cdn_url NOT LIKE 'fixture://%'" : ""}
    ORDER BY created_at DESC
    ${LIMIT > 0 ? `LIMIT ${LIMIT}` : ""}
    `,
    [publicBase],
  );

  console.error(`assets a reprocessar: ${rows.length}`);

  const failures: Array<{ id: string; url: string | null; error: string }> = [];
  let migrated = 0;
  let uploadedObjects = 0;
  let uploadedBytes = 0;

  await mapLimit(rows, CONCURRENCY, async (row) => {
    if (!row.cdn_url) return;
    try {
      const downloaded = await downloadAssetBytes(row.cdn_url);
      const optimized = await optimizeImage(downloaded.bytes);
      const mime = mimeFromFormat(optimized.format) ?? row.mime ?? "application/octet-stream";
      const prefix = `assets/${row.sha256.slice(0, 2)}/${row.sha256}`;
      const originalKey = `${prefix}/original${extensionFor(mime)}`;

      await storage.put({ key: originalKey, body: downloaded.bytes, contentType: mime });
      uploadedObjects++;
      uploadedBytes += downloaded.bytes.byteLength;

      const derivatives: Record<string, unknown> = {};
      for (const d of optimized.derivatives) {
        const key = `${prefix}/${d.size}.${d.format}`;
        await storage.put({ key, body: d.bytes, contentType: d.mime });
        uploadedObjects++;
        uploadedBytes += d.bytes.byteLength;
        derivatives[`${d.size}.${d.format}`] = {
          url: `${publicBase}/${key}`,
          mime: d.mime,
          width: d.width,
          height: d.height,
        };
      }
      derivatives.original = {
        url: `${publicBase}/${originalKey}`,
        mime,
        width: optimized.width,
        height: optimized.height,
      };

      // Substitui derivatives inteiro, preservando só o _meta antigo: as chaves velhas
      // apontam para objetos que nunca existiram e respondem 403.
      await pool.query(
        `
        UPDATE media.assets
        SET storage_key = $2,
            cdn_url = $3,
            width = COALESCE($4, width),
            height = COALESCE($5, height),
            mime = COALESCE($6, mime),
            size_bytes = $7,
            derivatives = jsonb_build_object('_meta', COALESCE(derivatives->'_meta', '{}'::jsonb))
                          || $8::jsonb
        WHERE id = $1
        `,
        [
          row.id,
          originalKey,
          `${publicBase}/${originalKey}`,
          optimized.width ?? null,
          optimized.height ?? null,
          mime,
          downloaded.bytes.byteLength,
          JSON.stringify({ ...derivatives, _pipeline: "asset-pipeline-v3-r2", _storage: storage.id }),
        ],
      );
      migrated++;
      if (migrated % 50 === 0) console.error(`migrados ${migrated}/${rows.length}`);
    } catch (err) {
      failures.push({
        id: row.id,
        url: row.cdn_url,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });

  const report = {
    generatedAt: new Date().toISOString(),
    scanned: rows.length,
    migrated,
    uploadedObjects,
    uploadedMB: Math.round((uploadedBytes / 1024 / 1024) * 10) / 10,
    failed: failures.length,
    failures: failures.slice(0, 200),
  };
  mkdirSync(".tmp", { recursive: true });
  writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ...report, failures: undefined, report: REPORT_PATH }, null, 2));
} finally {
  await pool.end();
}
