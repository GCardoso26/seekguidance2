"use client";

import Link from "next/link";
import { PROFILE_AI_SLOTS } from "@/lib/profile-ai-slots";

/** Scaffold visual — providers não implementados. */
export function ProfileAiSlots() {
  return (
    <section className="space-y-3" data-testid="profile-ai-slots" aria-label="Extensões IA">
      <header>
        <h2 className="text-h3 font-semibold text-foreground">Insights (extensão)</h2>
        <p className="text-small text-muted-foreground">
          Pontos de extensão — sem implementação neste épico.
        </p>
      </header>
      <ul className="grid gap-2 sm:grid-cols-2">
        {PROFILE_AI_SLOTS.map((slot) => (
          <li
            key={slot.id}
            className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-4"
          >
            <p className="text-sm font-medium text-foreground">{slot.label}</p>
            <p className="mt-1 text-caption text-muted-foreground">{slot.description}</p>
          </li>
        ))}
      </ul>
      <p className="text-caption text-muted-foreground">
        Veja também recomendações do buyer em{" "}
        <Link href="/comprador" className="text-primary hover:underline">
          /comprador
        </Link>
        .
      </p>
    </section>
  );
}
