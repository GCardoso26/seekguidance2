/**
 * Cloudflare R2 via API S3-compatível (ADR-017).
 * Só é ativado quando todas as credenciais existem; caso contrário o
 * `createObjectStorageFromEnv` devolve o Noop e o pipeline mantém a URL de origem.
 */
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createLogger } from "../../platform/logging/logger.js";
import {
  NoopObjectStorage,
  setObjectStorage,
  type ObjectStoragePort,
  type PutObjectInput,
} from "./ObjectStoragePort.js";

const log = createLogger("assets.storage.r2");

/** Objeto imutável — a chave carrega o sha256 do conteúdo. */
const IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable";

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  endpoint?: string;
}

export class R2ObjectStorage implements ObjectStoragePort {
  readonly id = "r2";
  readonly enabled = true;
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(config: R2Config) {
    this.bucket = config.bucket;
    this.client = new S3Client({
      region: "auto",
      endpoint: config.endpoint ?? `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async put(input: PutObjectInput): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
        CacheControl: input.cacheControl ?? IMMUTABLE_CACHE_CONTROL,
      }),
    );
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return true;
    } catch (err) {
      const status = (err as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode;
      if (status === 404 || status === 403) return false;
      throw err;
    }
  }
}

export function createObjectStorageFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): ObjectStoragePort {
  const accountId = env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = env.R2_BUCKET?.trim();

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    return new NoopObjectStorage();
  }

  log.info({ bucket }, "object_storage_r2_enabled");
  return new R2ObjectStorage({
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    endpoint: env.R2_ENDPOINT?.trim() || undefined,
  });
}

let bootstrapped = false;

/** Idempotente — chamado por CLI, workers e scripts de backfill. */
export function bootstrapObjectStorage(env: NodeJS.ProcessEnv = process.env): ObjectStoragePort {
  const port = createObjectStorageFromEnv(env);
  if (!bootstrapped) {
    setObjectStorage(port);
    bootstrapped = true;
  }
  return port;
}
