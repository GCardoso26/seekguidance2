"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeckValidationModal } from "./DeckValidationModal";
import { useValidateDeck } from "@/hooks/useDeck";
import { useDeckRevisions } from "@/hooks/useDeckRevisions";
import type { Deck, DeckFormat } from "@/types/deck";
import type { ValidationResult } from "@/lib/deck-validation";

interface SaveDeckButtonProps {
  deck: Deck;
  format?: DeckFormat | null;
  onSaved?: (validation: ValidationResult) => void;
}

export function SaveDeckButton({ deck, format, onSaved }: SaveDeckButtonProps) {
  const validateDeck = useValidateDeck(deck.id);
  const { record } = useDeckRevisions(deck.id);
  const [showModal, setShowModal] = useState(false);
  const [lastValidation, setLastValidation] = useState<ValidationResult | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const formatLabel = format?.display_name ?? deck.format;

  const handleSave = async () => {
    try {
      const validation = await validateDeck.mutateAsync();
      setLastValidation(validation);
      record(deck, validation.isValid ? "Salvar (válido)" : "Salvar (rascunho)");
      onSaved?.(validation);

      if (validation.isValid) {
        setToast(`Deck salvo e válido para ${formatLabel}`);
        setTimeout(() => setToast(null), 4000);
        return;
      }

      setShowModal(true);
    } catch {
      setToast("Erro ao salvar deck");
      setTimeout(() => setToast(null), 4000);
    }
  };

  const handleSaveDraft = () => {
    setShowModal(false);
    record(deck, "Salvar como rascunho");
    setToast("Deck salvo como rascunho");
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <>
      <Button type="button" size="sm" onClick={() => void handleSave()} disabled={validateDeck.isPending}>
        {validateDeck.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        Salvar deck
      </Button>

      {toast && (
        <div
          className={`fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-2 text-sm shadow-lg ${
            toast.includes("Erro") ? "bg-red-600 text-foreground" : "bg-emerald-600 text-foreground"
          }`}
        >
          {toast}
        </div>
      )}

      {lastValidation && (
        <DeckValidationModal
          open={showModal}
          formatName={formatLabel}
          validation={lastValidation}
          onCorrect={() => setShowModal(false)}
          onSaveDraft={handleSaveDraft}
        />
      )}
    </>
  );
}
