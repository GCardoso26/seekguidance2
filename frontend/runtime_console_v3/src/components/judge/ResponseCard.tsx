"use client";
import { useState } from "react";
import type { JudgeResponse } from "@/types/judge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Props = {
  response: JudgeResponse;
  question: string;
};

export function ResponseCard({ response, question }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyAnswer() {
    try {
      await navigator.clipboard.writeText(response.answer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <article className="rounded-xl border border-border bg-card/60 p-4 md:p-5 space-y-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>Pergunta</span>
        <Badge variant={response.success ? "success" : "danger"}>
          {response.success ? "OK" : "Aviso"}
        </Badge>
        {response.success && (
          <span>Confiança {(response.confidence * 100).toFixed(0)}%</span>
        )}
      </div>
      <p className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3">{question}</p>
      <div className="prose prose-invert max-w-none">
        <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{response.answer}</p>
      </div>
      {response.sources.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fontes</p>
          <ul className="space-y-2">
            {response.sources.map((s, i) => (
              <li key={`${s.url}-${i}`} className="text-xs rounded-lg bg-muted/40 p-2">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline font-medium"
                >
                  {s.title}
                  {s.section ? ` · ${s.section}` : ""}
                </a>
                {s.excerpt && <p className="mt-1 text-muted-foreground line-clamp-2">{s.excerpt}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={copyAnswer}>
          {copied ? "Copiado" : "Copiar resposta"}
        </Button>
      </div>
    </article>
  );
}
