"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { isFeatureEnabled } from "@/lib/feature-flags";
import type { AssistantSuggestion, AssistantSurface } from "@/lib/ai-assistants/interfaces";

/**
 * Contextual AI strip — never a chatbot. Suggestion cards only.
 */
export function ContextualAssistantStrip({
  surface,
  load,
}: {
  surface: AssistantSurface;
  load: () => Promise<AssistantSuggestion[]>;
}) {
  const enabled = isFeatureEnabled("AI_ASSISTANTS");
  const { data = [] } = useQuery({
    queryKey: ["ai-assistant", surface],
    queryFn: load,
    enabled,
    staleTime: 120_000,
  });

  if (!enabled || !data.length) return null;

  return (
    <aside
      className="rounded-xl border border-primary/25 bg-primary/5 p-4"
      data-testid={`ai-assistant-${surface}`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
        Assistente · {surface}
      </p>
      <ul className="mt-2 space-y-2">
        {data.map((s) => (
          <li key={s.id} className="text-sm">
            <p className="font-medium text-foreground">{s.message}</p>
            {s.href ? (
              <Link href={s.href} className="mt-1 inline-flex text-xs text-primary hover:underline">
                {s.ctaLabel ?? "Abrir"} →
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </aside>
  );
}
