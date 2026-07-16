/** Portable ID generation — never call `crypto.randomUUID()` in domain/application code. */
export interface IdGenerator {
  generate(): string;
}

/** Default: UUID v4 (Node crypto). Swap to UUIDv7 later without touching callers. */
export class UuidIdGenerator implements IdGenerator {
  generate(): string {
    return crypto.randomUUID();
  }
}

/** Deterministic IDs for tests / replay. */
export class SequentialIdGenerator implements IdGenerator {
  private seq = 0;
  constructor(private readonly prefix = "id") {}

  generate(): string {
    this.seq += 1;
    return `${this.prefix}-${String(this.seq).padStart(8, "0")}`;
  }

  reset(start = 0): void {
    this.seq = start;
  }
}

let activeIds: IdGenerator = new UuidIdGenerator();

export function getIdGenerator(): IdGenerator {
  return activeIds;
}

export function setIdGenerator(gen: IdGenerator): void {
  activeIds = gen;
}

export function resetIdGenerator(): void {
  activeIds = new UuidIdGenerator();
}
