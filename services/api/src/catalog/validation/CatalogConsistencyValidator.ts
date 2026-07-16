import type { TxContext } from "../../platform/transaction/types.js";
import { getClock } from "../../shared/time/Clock.js";
import type { CatalogCardRepository } from "../domain/CatalogCardRepository.js";
import type { CatalogSetRepository } from "../domain/CatalogSetRepository.js";
import type { CatalogVariantRepository } from "../domain/CatalogVariantRepository.js";
import type { ProviderMappingRepository } from "../domain/ProviderMappingRepository.js";
import type { OutboxRepository } from "../../platform/outbox/types.js";
import type {
  ConsistencyCheckId,
  ConsistencyReport,
  ConsistencyValidator,
  ConsistencyViolation,
} from "./ConsistencyValidator.js";

/**
 * In-memory / portable consistency checks for smoke + SHADOW.
 * Postgres SQL validators can implement the same ConsistencyValidator port later.
 */
export class CatalogConsistencyValidator implements ConsistencyValidator {
  constructor(
    private readonly deps: {
      tx: { runInTransaction<T>(fn: (tx: TxContext) => Promise<T>): Promise<T> };
      cards: CatalogCardRepository;
      sets: CatalogSetRepository;
      variants: CatalogVariantRepository;
      mappings: ProviderMappingRepository;
      outbox: OutboxRepository;
      /** Known card ids in scope (InMemory enumeration helper). */
      listCardIds: () => string[];
      listVariantIds: () => string[];
      listMappingIds: () => string[];
    },
  ) {}

  async run(): Promise<ConsistencyReport> {
    const violations: ConsistencyViolation[] = [];

    await this.deps.tx.runInTransaction(async (tx) => {
      for (const id of this.deps.listCardIds()) {
        const card = await this.deps.cards.findById(tx, id);
        if (!card) continue;
        if (card.setId) {
          const set = await this.deps.sets.findById(tx, card.setId);
          if (!set) {
            violations.push(v("broken_fk", `card ${id} set_id missing`, id));
          }
        } else {
          violations.push(v("card_without_set", `card ${id} has no set_id`, id));
        }
      }

      for (const id of this.deps.listVariantIds()) {
        const variant = await this.deps.variants.findById(tx, id);
        if (!variant) continue;
        const card = await this.deps.cards.findById(tx, variant.cardId);
        if (!card) {
          violations.push(v("orphan_variant", `variant ${id} card missing`, id));
        }
      }

      for (const id of this.deps.listMappingIds()) {
        const m = await this.deps.mappings.findById(tx, id);
        if (!m) continue;
        if (m.providerObjectType === "CARD" && m.catalogCardId) {
          const card = await this.deps.cards.findById(tx, m.catalogCardId);
          if (!card) {
            violations.push(v("orphan_mapping", `mapping ${id} card missing`, id));
          }
        }
        if (m.providerObjectType === "SET" && m.catalogSetId) {
          const set = await this.deps.sets.findById(tx, m.catalogSetId);
          if (!set) {
            violations.push(v("orphan_mapping", `mapping ${id} set missing`, id));
          }
        }
        if (m.providerObjectType === "VARIANT" && m.catalogVariantId) {
          const variant = await this.deps.variants.findById(tx, m.catalogVariantId);
          if (!variant) {
            violations.push(v("orphan_mapping", `mapping ${id} variant missing`, id));
          }
        }
      }
    });

    const pending = await this.deps.outbox.countByStatus("pending");
    const leased = await this.deps.outbox.countByStatus("leased");
    // Soft check for smoke: only flag if leased stuck without pending processing context.
    // Hard gate for CANARY: pending+leased should be 0 after publisher catch-up.
    if (pending + leased > 0) {
      violations.push(
        v(
          "stuck_outbox",
          `outbox backlog pending=${pending} leased=${leased} (must be 0 before CANARY)`,
        ),
      );
    }

    return {
      passed: violations.length === 0,
      violations,
      checkedAt: getClock().nowIso(),
    };
  }
}

function v(
  checkId: ConsistencyCheckId,
  message: string,
  aggregateId?: string,
): ConsistencyViolation {
  return { checkId, message, aggregateId };
}
