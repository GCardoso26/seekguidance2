"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { DeckValidation } from "@/types/deck";

interface DeckValidationBarProps {
  currentCards: number;
  minCards?: number;
  maxCards?: number | null;
  validation?: DeckValidation | null;
}

export function DeckValidationBar({
  currentCards,
  minCards = 60,
  maxCards = null,
  validation,
}: DeckValidationBarProps) {
  const target = typeof maxCards === "number" && maxCards > 0 ? maxCards : Math.max(minCards, currentCards);
  const progress = Math.min(100, Math.round((currentCards / Math.max(target, 1)) * 100));
  const isValid = validation?.isValid ?? currentCards >= minCards;

  return (
    <div className="surface-card rounded-lg p-3">
      <div className="mb-2 flex items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-2">
          {isValid ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          )}
          <span className="font-medium">{isValid ? "Deck legal" : "Validação pendente"}</span>
        </div>
        <span className="text-muted-foreground">
          {currentCards}/{target} cartas
        </span>
      </div>
      <Progress value={progress} />
      {validation?.errors?.length ? (
        <p className="mt-2 text-xs text-red-300">{validation.errors[0]}</p>
      ) : null}
    </div>
  );
}
