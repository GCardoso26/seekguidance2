"use client";

import { Shield, Star, Award, AlertTriangle, Sparkles } from "lucide-react";

const LEVEL_LABELS: Record<string, string> = {
  new: "Novo",
  bronze: "Bronze",
  silver: "Prata",
  gold: "Ouro",
  platinum: "Platina",
};

const BADGE_LABELS: Record<string, string> = {
  new_seller: "Novo vendedor",
  trusted_seller: "Confiável",
  verified_seller: "Verificado",
  top_seller: "Top seller",
  sla_excellent: "SLA excelente",
  highly_rated: "Bem avaliado",
  under_review: "Em revisão",
};

type Props = {
  level?: string;
  badges?: string[];
  trustScore?: number;
  compact?: boolean;
};

export function TrustBadge({ level = "new", badges = [], trustScore, compact = false }: Props) {
  const levelLabel = LEVEL_LABELS[level] ?? level;
  const Icon = level === "platinum" ? Award : level === "gold" ? Star : Shield;

  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? "" : "gap-3"}`}>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-success">
        <Icon className="h-3.5 w-3.5" />
        {levelLabel}
        {trustScore != null && <span className="text-muted-foreground">· {trustScore.toFixed(0)}</span>}
      </span>
      {badges.slice(0, compact ? 2 : 4).map((b) => (
        <span
          key={b}
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
            b === "under_review"
              ? "border border-amber-500/40 bg-amber-500/10 text-amber-300"
              : "border border-border bg-card shadow-card text-muted-foreground"
          }`}
        >
          {b === "under_review" ? <AlertTriangle className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
          {BADGE_LABELS[b] ?? b}
        </span>
      ))}
    </div>
  );
}
