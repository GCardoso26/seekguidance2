"use client";

import { useState } from "react";
import { buildJudgeShareUrl } from "@/lib/judge-url";
import type { TcgType } from "@/types/judge";
import { Check, Link2 } from "lucide-react";

type Props = {
  tcg: TcgType;
  question: string;
  disabled?: boolean;
};

export function ShareVerdictButton({ tcg, question, disabled }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const url = buildJudgeShareUrl(tcg, question);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copie o link:", url);
    }
  }

  return (
    <button
      type="button"
      disabled={disabled || !question.trim()}
      onClick={copyLink}
      className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--border))] bg-white px-3 py-1.5 text-xs font-semibold text-[hsl(222_20%_35%)] transition hover:border-[hsl(var(--tcg-accent)/0.35)] hover:shadow-sm disabled:opacity-50"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
      {copied ? "Link copiado" : "Partilhar"}
    </button>
  );
}
