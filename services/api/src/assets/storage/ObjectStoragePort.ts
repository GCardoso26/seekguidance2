/**
 * Porta de object storage (ADR-017). Domínio nunca importa SDK de storage direto —
 * o default é `NoopObjectStorage`, então dev, CI e teste rodam sem rede e sem credencial.
 */
export interface PutObjectInput {
  key: string;
  body: Buffer;
  contentType: string;
  /** Objeto imutável: a chave contém o sha256. */
  cacheControl?: string;
}

export interface ObjectStoragePort {
  readonly id: string;
  /** True quando há credencial configurada e o upload realmente sai daqui. */
  readonly enabled: boolean;
  put(input: PutObjectInput): Promise<void>;
  exists(key: string): Promise<boolean>;
}

export class NoopObjectStorage implements ObjectStoragePort {
  readonly id = "noop";
  readonly enabled = false;

  async put(): Promise<void> {
    /* nada sobe; o pipeline mantém a URL de origem */
  }

  async exists(): Promise<boolean> {
    return false;
  }
}

let active: ObjectStoragePort = new NoopObjectStorage();

export function getObjectStorage(): ObjectStoragePort {
  return active;
}

export function setObjectStorage(port: ObjectStoragePort): void {
  active = port;
}

export function resetObjectStorage(): void {
  active = new NoopObjectStorage();
}
