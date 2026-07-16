import { getClock } from "../../shared/time/Clock.js";

/**
 * Consistency validators — run after each sync; gate before CANARY.
 * @see FOUNDATION_FREEZE §14.4
 */
export type ConsistencyCheckId =
  | "card_without_set"
  | "orphan_mapping"
  | "orphan_variant"
  | "stuck_outbox"
  | "broken_fk"
  | "official_image_on_listing"
  | "duplicate_provider_mapping";

export interface ConsistencyViolation {
  checkId: ConsistencyCheckId;
  message: string;
  aggregateId?: string;
}

export interface ConsistencyReport {
  passed: boolean;
  violations: ConsistencyViolation[];
  checkedAt: string;
}

export interface ConsistencyValidator {
  run(): Promise<ConsistencyReport>;
}

/** Combines multiple validators into one gate. */
export class CompositeConsistencyValidator implements ConsistencyValidator {
  constructor(private readonly validators: ConsistencyValidator[]) {}

  async run(): Promise<ConsistencyReport> {
    const violations: ConsistencyViolation[] = [];
    for (const v of this.validators) {
      const report = await v.run();
      violations.push(...report.violations);
    }
    return {
      passed: violations.length === 0,
      violations,
      checkedAt: getClock().nowIso(),
    };
  }
}
