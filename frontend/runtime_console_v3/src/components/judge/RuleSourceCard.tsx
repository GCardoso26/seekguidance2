"use client";

import { useState, type CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { formatJudgeSource, sourceTypeBadge } from "@/lib/judge-sources";
import { highlightExcerptHtml, sanitizeSourceUrl } from "@/lib/highlight-excerpt";
import { showToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import type { JudgeSource } from "@/types/judge";
import { Copy, Expand, ExternalLink } from "lucide-react";

type Props = {
  source: JudgeSource;
  index: number;
  highlightTerms?: string[];
  accent?: string;
};

export function RuleSourceCard({ source, index, highlightTerms = [], accent }: Props) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [copied, setCopied] = useState(false);
  const reduceMotion = useReducedMotion();
  const f = formatJudgeSource(source, index);
  const safeUrl = sanitizeSourceUrl(f.url);
  const badge = sourceTypeBadge(f.sourceType);
  const fullText = f.excerpt ?? "";

  async function copyRuleAtom(e: React.MouseEvent) {
    e.stopPropagation();
    if (!f.ruleAtom) return;
    try {
      await navigator.clipboard.writeText(f.ruleAtom);
      setCopied(true);
      showToast("Regra copiada!", "success");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      showToast("Não foi possível copiar", "error");
    }
  }

  const style = accent
    ? ({ "--tcg-accent": accent, "--tcg-accent-fg": "0 0% 100%" } as CSSProperties)
    : undefined;

  const pageHash =
    safeUrl && f.pageNumber != null ? `${safeUrl}#page=${f.pageNumber}` : safeUrl;

  return (
    <li className="judge-rule-source-card judge-card list-none overflow-hidden rounded-2xl shadow-lg" style={style}>
      <div
        className="perspective-1000 h-52 w-full cursor-pointer"
        onClick={() => setIsFlipped((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsFlipped((v) => !v);
          }
        }}
        role="button"
        tabIndex={0}
        aria-pressed={isFlipped}
        aria-label={isFlipped ? "Mostrar resumo da fonte" : "Virar carta para ver trecho completo"}
      >
        <motion.div
          className="preserve-3d relative h-full w-full"
          animate={{ rotateY: reduceMotion ? 0 : isFlipped ? 180 : 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.55, type: "spring", stiffness: 260, damping: 22 }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Frente */}
          <div className="backface-hidden absolute inset-0 flex flex-col rounded-2xl border border-border/50 bg-card/80 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              {f.ruleAtom ? (
                <code className="judge-rule-atom-badge rounded-full px-2 py-0.5 text-xs font-semibold">
                  {f.ruleAtom}
                </code>
              ) : (
                <span className="text-xs font-semibold text-[var(--tcg-text-primary)]">{f.title}</span>
              )}
              <div className="flex items-center gap-1.5">
                <span className={cn("rounded px-1.5 py-0.5 text-caption font-bold uppercase", badge.className)}>
                  {badge.label}
                </span>
                <Expand className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              </div>
            </div>
            {f.excerpt && (
              <p
                className="line-clamp-4 flex-1 text-xs leading-relaxed text-[var(--tcg-text-secondary)]"
                dangerouslySetInnerHTML={{
                  __html: highlightExcerptHtml(f.excerpt.slice(0, 400), highlightTerms),
                }}
              />
            )}
            <span className="mt-auto text-caption text-[var(--tcg-text-secondary)] opacity-70">
              Toque para virar a carta
            </span>
          </div>

          {/* Verso */}
          <div
            className="backface-hidden absolute inset-0 flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/90 p-4"
            style={{ transform: "rotateY(180deg)" }}
          >
            <p className="mb-2 text-xs font-semibold text-[var(--tcg-text-primary)]">{f.title}</p>
            <div
              className="flex-1 overflow-y-auto text-xs leading-relaxed text-[var(--tcg-text-primary)]"
              dangerouslySetInnerHTML={{
                __html: highlightExcerptHtml(fullText, highlightTerms),
              }}
            />
            <div className="mt-2 flex gap-2">
              {f.ruleAtom && (
                <button
                  type="button"
                  onClick={copyRuleAtom}
                  className="verdict-card inline-flex min-h-12 min-w-12 items-center justify-center rounded-lg border border-[var(--tcg-border)]"
                  aria-label="Copiar regra"
                >
                  <Copy className="h-4 w-4" />
                  {copied && <span className="sr-only">Copiado</span>}
                </button>
              )}
              {pageHash && (
                <a
                  href={pageHash}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex min-h-12 items-center gap-1 rounded-lg px-3 text-xs text-[var(--tcg-primary-light)] hover:underline"
                >
                  Abrir fonte <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </li>
  );
}
