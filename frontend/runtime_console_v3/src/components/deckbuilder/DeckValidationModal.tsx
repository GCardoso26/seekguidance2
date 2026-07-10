"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatValidationErrors } from "@/lib/deck-validation";
import type { ValidationResult } from "@/lib/deck-validation";

interface DeckValidationModalProps {
  open: boolean;
  formatName: string;
  validation: ValidationResult;
  onCorrect: () => void;
  onSaveDraft: () => void;
}

export function DeckValidationModal({
  open,
  formatName,
  validation,
  onCorrect,
  onSaveDraft,
}: DeckValidationModalProps) {
  if (!open) return null;

  const lines = formatValidationErrors(validation.errors, validation.warnings);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">Deck com erros de validação</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Seu deck tem {validation.errors.length} erro(s) para {formatName}.
            </p>
          </div>
        </div>

        <ul className="mt-4 max-h-48 space-y-2 overflow-y-auto text-sm text-foreground">
          {lines.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="text-warning">•</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCorrect}>
            Corrigir
          </Button>
          <Button type="button" onClick={onSaveDraft}>
            Salvar como rascunho
          </Button>
        </div>
      </div>
    </div>
  );
}
