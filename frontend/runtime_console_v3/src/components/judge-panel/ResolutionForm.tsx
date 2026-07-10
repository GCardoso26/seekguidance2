"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { PenaltyType } from "@/lib/infractions/schema";

type Props = {
  onSubmit: (data: { penalty: PenaltyType; notes: string; rulingId: string }) => void | Promise<void>;
};

export function ResolutionForm({ onSubmit }: Props) {
  const [penalty, setPenalty] = useState<PenaltyType>("warning");
  const [notes, setNotes] = useState("");
  const [rulingId, setRulingId] = useState("");

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit({ penalty, notes, rulingId });
      }}
    >
      <label className="block text-sm text-muted-foreground">
        Penalidade
        <select
          className="mt-1 w-full surface-card rounded-lg px-3 py-2 text-foreground"
          value={penalty}
          onChange={(e) => setPenalty(e.target.value as PenaltyType)}
        >
          <option value="warning">Warning</option>
          <option value="game_loss">Game Loss</option>
          <option value="match_loss">Match Loss</option>
          <option value="disqualification">Disqualification</option>
        </select>
      </label>
      <label className="block text-sm text-muted-foreground">
        Ruling aplicada (ID)
        <input
          className="mt-1 w-full surface-card rounded-lg px-3 py-2 text-foreground"
          value={rulingId}
          onChange={(e) => setRulingId(e.target.value)}
          placeholder="seed-lorcana-0"
        />
      </label>
      <label className="block text-sm text-muted-foreground">
        Notas do juiz
        <textarea
          className="mt-1 min-h-[100px] w-full surface-card rounded-lg px-3 py-2 text-foreground"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notas da decisão..."
          required
        />
      </label>
      <Button type="submit" className="w-full">
        Resolver report
      </Button>
    </form>
  );
}
