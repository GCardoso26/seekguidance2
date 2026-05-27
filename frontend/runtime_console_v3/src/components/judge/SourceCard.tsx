"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { formatJudgeSource } from "@/lib/judge-sources";
import { highlightExcerptHtml, sanitizeSourceUrl } from "@/lib/highlight-excerpt";
import { cn } from "@/lib/utils";
import type { JudgeSource } from "@/types/judge";
import { ChevronDown, ExternalLink } from "lucide-react";

type Props = {
  source: JudgeSource;
  index: number;
  highlightTerms?: string[];
  accent?: string;
};

export function SourceCard({ source, index, highlightTerms = [], accent }: Props) {
  const [open, setOpen] = useState(index === 0);
  const f = formatJudgeSource(source, index);
  const safeUrl = sanitizeSourceUrl(f.url);
  const panelId = `judge-source-${index}`;

  return (
    <li
      className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40 overflow-hidden"
      style={accent ? ({ "--tcg-accent": accent, "--tcg-accent-fg": "0 0% 100%" } as CSSProperties) : undefined}
    >
      <button
        type="button"
        id={`${panelId}-trigger`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-2 p-3 text-left transition hover:bg-white/60"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--tcg-accent))] text-xs font-bold text-[hsl(var(--tcg-accent-fg))]">
          {f.index}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug">{f.title}</p>
          <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-[hsl(222_15%_45%)]">
            {f.rulePath && <span>Regra {f.rulePath}</span>}
            {f.pageNumber != null && <span>Pág. {f.pageNumber}</span>}
            {f.section && !f.rulePath && <span>{f.section}</span>}
            {f.section && f.rulePath && f.section !== `Secção ${f.rulePath}` && (
              <span>{f.section}</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {f.hasLink && safeUrl && (
            <a
              href={safeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md p-1 text-[hsl(var(--tcg-accent))] hover:bg-[hsl(var(--tcg-accent)/0.08)]"
              aria-label="Abrir fonte"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-[hsl(222_15%_45%)] transition-transform",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </div>
      </button>

      {open && f.excerpt && (
        <div id={panelId} role="region" aria-labelledby={`${panelId}-trigger`} className="border-t border-[hsl(var(--border))] px-3 pb-3">
          <blockquote
            className="mt-2 border-l-2 border-[hsl(var(--tcg-accent)/0.45)] pl-3 text-xs leading-relaxed text-[hsl(222_20%_35%)]"
            dangerouslySetInnerHTML={{
              __html: `<span class="font-medium text-[hsl(222_15%_45%)]">Trecho: </span>${highlightExcerptHtml(f.excerpt, highlightTerms)}`,
            }}
          />
        </div>
      )}
    </li>
  );
}
