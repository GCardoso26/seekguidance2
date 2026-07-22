"use client";

/**
 * Pontos de extensão para advisors de IA — não implementados ainda (Épico 2).
 * Mantém slots estáveis para Deck / Price / Collection / Combo / Upgrade.
 */
export function CardAiAdvisorSlots({ cardId }: { cardId: string }) {
  return (
    <aside
      className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-5"
      data-testid="card-ai-advisor-slots"
      data-card-id={cardId}
      aria-label="Advisors de IA (em breve)"
    >
      <p className="text-small font-medium text-foreground">Advisors (em breve)</p>
      <p className="mt-1 text-caption text-muted-foreground">
        Espaço reservado para Deck Advisor, Price Advisor, Collection Advisor, Combo Suggestions e
        Deck Upgrade — mesmos pontos de extensão em todos os TCGs.
      </p>
      <ul className="mt-3 flex flex-wrap gap-2" aria-hidden>
        {["deck-advisor", "price-advisor", "collection-advisor", "combo-suggestions", "deck-upgrade"].map(
          (slot) => (
            <li
              key={slot}
              data-ai-slot={slot}
              className="rounded-md border border-border/60 px-2 py-1 text-caption text-muted-foreground"
            >
              {slot}
            </li>
          ),
        )}
      </ul>
    </aside>
  );
}
