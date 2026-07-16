/**
 * Simulates domain TX: insert outbox only after "commit" flag.
 * Used to prove commit-before-publish without real PG.
 */
export class SimulatedUnitOfWork {
  private committed = false;
  private pendingInsert: (() => Promise<void>) | null = null;

  scheduleOutboxInsert(fn: () => Promise<void>): void {
    this.pendingInsert = fn;
  }

  async commit(): Promise<void> {
    if (this.pendingInsert) {
      await this.pendingInsert();
      this.pendingInsert = null;
    }
    this.committed = true;
  }

  get isCommitted(): boolean {
    return this.committed;
  }
}
