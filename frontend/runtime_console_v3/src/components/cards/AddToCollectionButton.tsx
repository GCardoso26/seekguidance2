"use client";

import { useState } from "react";
import { Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { AddToCollectionModal } from "@/components/collection/AddToCollectionModal";

interface AddToCollectionButtonProps {
  cardId: string;
  cardName?: string;
}

export function AddToCollectionButton({ cardId, cardName }: AddToCollectionButtonProps) {
  const { user } = useJudgeAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Library className="mr-2 h-4 w-4" />
        Tenho esta carta
      </Button>
      <AddToCollectionModal
        open={open}
        cardId={cardId}
        cardName={cardName}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
