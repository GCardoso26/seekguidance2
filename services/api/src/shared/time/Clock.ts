/** Portable clock — never call `new Date()` / `Date.now()` in domain/application code. */
export interface Clock {
  now(): Date;
  nowIso(): string;
  nowMs(): number;
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
  nowIso(): string {
    return this.now().toISOString();
  }
  nowMs(): number {
    return this.now().getTime();
  }
}

/** Deterministic clock for tests / replay. */
export class FixedClock implements Clock {
  constructor(private instant: Date) {}

  now(): Date {
    return new Date(this.instant.getTime());
  }
  nowIso(): string {
    return this.now().toISOString();
  }
  nowMs(): number {
    return this.instant.getTime();
  }
  set(instant: Date): void {
    this.instant = new Date(instant.getTime());
  }
  advance(ms: number): void {
    this.instant = new Date(this.instant.getTime() + ms);
  }
}

let activeClock: Clock = new SystemClock();

export function getClock(): Clock {
  return activeClock;
}

export function setClock(clock: Clock): void {
  activeClock = clock;
}

export function resetClock(): void {
  activeClock = new SystemClock();
}
