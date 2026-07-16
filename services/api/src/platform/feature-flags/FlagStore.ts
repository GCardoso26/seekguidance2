export type FlagScope = "feature" | "provider" | "game";

export interface FlagStore {
  isEnabled(scope: FlagScope, key: string, id?: string): boolean;
  set(scope: FlagScope, key: string, enabled: boolean, id?: string): void;
}

/** In-memory flags for Phase 1 (DB-backed in later phases). */
export class MemoryFlagStore implements FlagStore {
  private flags = new Map<string, boolean>();

  private k(scope: FlagScope, key: string, id?: string): string {
    return id ? `${scope}:${id}:${key}` : `${scope}:${key}`;
  }

  isEnabled(scope: FlagScope, key: string, id?: string): boolean {
    const v = this.flags.get(this.k(scope, key, id));
    return v ?? true; // default allow unless explicitly disabled
  }

  set(scope: FlagScope, key: string, enabled: boolean, id?: string): void {
    this.flags.set(this.k(scope, key, id), enabled);
  }
}

export const flagStore = new MemoryFlagStore();
