import { BanlistService } from "@/lib/deck-validator/BanlistService";
import { getFormatRules } from "@/lib/deck-validator/rules";
import type {
  Decklist,
  FormatSpecialRule,
  ValidationError,
  ValidationResult,
  ValidationWarning,
} from "@/lib/deck-validator/schema";

export class DeckValidator {
  constructor(private readonly banlistService = new BanlistService()) {}

  async validate(deck: Decklist): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const rules = getFormatRules(deck.tcg, deck.format);
    const banlist = await this.banlistService.getBanlist(deck.tcg, deck.format);

    const totalMain = deck.main_deck.reduce((s, c) => s + c.quantity, 0);
    if (totalMain < rules.min_cards) {
      errors.push({
        code: "DECK_TOO_SMALL",
        message: `Deck tem ${totalMain} cartas. Mínimo: ${rules.min_cards}`,
        severity: "error",
        rule_reference: `${deck.tcg.toUpperCase()} formato ${deck.format}`,
      });
    }
    if (totalMain > rules.max_cards) {
      errors.push({
        code: "DECK_TOO_LARGE",
        message: `Deck tem ${totalMain} cartas. Máximo: ${rules.max_cards}`,
        severity: "error",
      });
    }

    const counts = new Map<string, number>();
    for (const card of deck.main_deck) {
      counts.set(card.definition_id, (counts.get(card.definition_id) ?? 0) + card.quantity);
    }
    for (const [cardId, count] of counts) {
      if (count > rules.max_copies) {
        errors.push({
          code: "TOO_MANY_COPIES",
          message: `Carta ${cardId} aparece ${count} vezes. Máximo: ${rules.max_copies}`,
          severity: "error",
          cards_involved: [cardId],
        });
      }
      const status = banlist.cards.get(cardId);
      if (status === "banned") {
        errors.push({
          code: "BANNED_CARD",
          message: `Carta ${cardId} está banida (${deck.format})`,
          severity: "error",
          cards_involved: [cardId],
          rule_reference: `${deck.format} Banlist ${banlist.version}`,
        });
      } else if (status === "restricted" && count > 1) {
        errors.push({
          code: "RESTRICTED_CARD",
          message: `Carta ${cardId} é restricted (máx 1 cópia)`,
          severity: "error",
          cards_involved: [cardId],
        });
      }
    }

    if (rules.has_sideboard && deck.sideboard) {
      const sbTotal = deck.sideboard.reduce((s, c) => s + c.quantity, 0);
      if (rules.sideboard_size && sbTotal > rules.sideboard_size) {
        errors.push({
          code: "SIDEBOARD_TOO_LARGE",
          message: `Sideboard tem ${sbTotal} cartas. Máximo: ${rules.sideboard_size}`,
          severity: "error",
        });
      }
    }

    for (const rule of rules.special_rules ?? []) {
      errors.push(...this.validateSpecialRule(deck, rule));
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      format_rules_applied: `${deck.tcg}:${deck.format}`,
      banlist_version: banlist.version,
    };
  }

  private validateSpecialRule(
    deck: Decklist,
    rule: FormatSpecialRule,
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    if (rule.type === "leader_required") {
      const leaders = deck.main_deck.filter((c) => c.definition_id.includes("leader"));
      if (leaders.reduce((s, c) => s + c.quantity, 0) < rule.quantity) {
        errors.push({
          code: "LEADER_REQUIRED",
          message: `É necessário ${rule.quantity} carta(s) líder.`,
          severity: "error",
        });
      }
    }
    return errors;
  }
}
