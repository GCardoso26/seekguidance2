"use client";

import { COLLECTION_ALERT_SLOTS } from "@/lib/collection-v2";
import { isFeatureEnabled } from "@/lib/feature-flags";

/**
 * Estrutura de alertas da coleção — sem push/notificações ainda.
 */
export function CollectionAlertScaffold() {
  const enabled = isFeatureEnabled("COLLECTION_ALERTS");

  return (
    <section
      className="space-y-4"
      data-testid="collection-alert-scaffold"
      aria-labelledby="collection-alerts-title"
    >
      <div>
        <h2 id="collection-alerts-title" className="text-h3 text-foreground">
          Alertas da coleção
        </h2>
        <p className="mt-1 text-small text-muted-foreground">
          {enabled
            ? "Slots preparados para Feature Flags. Notificações push ainda não implementadas."
            : "Feature COLLECTION_ALERTS desligada neste ambiente."}
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {COLLECTION_ALERT_SLOTS.map((slot) => (
          <li
            key={slot.kind}
            data-alert-kind={slot.kind}
            className="rounded-xl border border-dashed border-border/70 bg-muted/20 px-4 py-4"
          >
            <p className="font-medium text-foreground">{slot.label}</p>
            <p className="mt-1 text-caption text-muted-foreground">{slot.description}</p>
            <p className="mt-3 text-caption text-muted-foreground">Em breve</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
