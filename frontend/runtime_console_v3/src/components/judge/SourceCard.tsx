"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { formatJudgeSource, sourceTypeBadge } from "@/lib/judge-sources";
import { highlightExcerptHtml, sanitizeSourceUrl } from "@/lib/highlight-excerpt";
import { cn } from "@/lib/utils";
import type { JudgeSource } from "@/types/judge";
import { ChevronDown, Copy, ExternalLink } from "lucide-react";

type Props = {
  source: JudgeSource;
  index: number;
  highlightTerms?: string[];
  accent?: string;
};

export function SourceCard({ source, index, highlightTerms = [], accent }: Props) {
  const [open, setOpen] = useState(index === 0);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const f = formatJudgeSource(source, index);
  const safeUrl = sanitizeSourceUrl(f.url);
  const panelId = `judge-source-${index}`;
  const badge = sourceTypeBadge(f.sourceType);

  async function copyRuleAtom(e: React.MouseEvent) {
    e.stopPropagation();
    if (!f.ruleAtom) return;
    try {
      await navigator.clipboard.writeText(f.ruleAtom);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard indisponível */
    }
  }

  return (
    <li
      className="overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--muted))]/40"
      style={accent ? ({ "--tcg-accent": accent, "--tcg-accent-fg": "0 0% 100%" } as CSSProperties) : undefined}
    >
      <button
        type="button"
        id={`${panelId}-trigger`}
        aria-expanded={open}
        aria-controls={panelId}
        title={[f.tooltipTitle, source.rule_title, f.tooltipSection, f.excerpt?.slice(0, 120)]
          .filter(Boolean)
          .join(" · ")}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-2 p-3 text-left transition hover:bg-white/60"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--tcg-accent))] text-xs font-bold text-[hsl(var(--tcg-accent-fg))]">
          {f.index}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold leading-snug">{f.title}</p>
            <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", badge.className)}>
              {badge.label}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-[hsl(222_15%_45%)]">
            {f.ruleAtom ? (
              <button
                type="button"
                onClick={copyRuleAtom}
                title={[source.rule_title, f.excerpt?.slice(0, 160)].filter(Boolean).join(" · ")}
                className="inline-flex items-center gap-1 rounded-md border border-[hsl(var(--tcg-accent)/0.35)] bg-[hsl(var(--tcg-accent)/0.08)] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[hsl(var(--tcg-accent))] hover:underline"
              >
                <code>{f.ruleAtom}</code>
                <Copy className="h-3 w-3" aria-hidden />
                {copied ? <span className="font-sans normal-case">Copiado</span> : null}
              </button>
            ) : null}
            {f.pageNumber != null && <span>Pág. {f.pageNumber}</span>}
            {f.section && <span>{f.section}</span>}
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
            className={cn("h-4 w-4 text-[hsl(222_15%_45%)] transition-transform", open && "rotate-180")}
            aria-hidden
          />
        </div>
      </button>

      <div
        id={panelId}
        role="region"
        aria-labelledby={`${panelId}-trigger`}
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-in-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          {f.excerpt && (
            <div className="border-t border-[hsl(var(--border))] px-3 pb-3">
              <blockquote
                className={cn(
                  "mt-2 border-l-2 border-[hsl(var(--tcg-accent)/0.45)] pl-3 text-xs leading-relaxed text-[hsl(222_20%_35%)] transition-[max-height] duration-300",
                  expanded ? "max-h-none" : "max-h-24 overflow-hidden",
                )}
                dangerouslySetInnerHTML={{
                  __html: `<span class="font-medium text-[hsl(222_15%_45%)]">Trecho: </span>${highlightExcerptHtml(f.excerpt, highlightTerms)}`,
                }}
              />
              <button
                type="button"
                className="mt-2 text-[11px] font-semibold text-[hsl(var(--tcg-accent))] hover:underline"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? "Recolher trecho" : "Ver trecho completo"}
              </button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
