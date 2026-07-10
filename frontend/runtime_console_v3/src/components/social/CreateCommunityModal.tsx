"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GameSelector } from "@/components/tournament/GameSelector";
import type { GameCode } from "@/lib/tcg-adapters";
import { showToast } from "@/lib/toast";

type Props = {
  onCreated?: (id: string) => void;
};

export function CreateCommunityModal({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [gameCode, setGameCode] = useState<GameCode | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const qc = useQueryClient();

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/social/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          game_code: gameCode ?? undefined,
          is_private: isPrivate,
        }),
      });
      if (!res.ok) throw new Error("Falha ao criar comunidade");
      return res.json() as Promise<{ id: string }>;
    },
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ["communities"] });
      showToast("Comunidade criada!", "success");
      setOpen(false);
      setName("");
      setDescription("");
      onCreated?.(data.id);
    },
    onError: () => showToast("Não foi possível criar a comunidade", "error"),
  });

  if (!open) {
    return (
      <Button className="bg-primary text-primary-foreground" onClick={() => setOpen(true)}>
        Criar comunidade
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-muted p-6 shadow-xl">
        <h2 className="text-xl font-bold">Nova comunidade</h2>
        <div className="mt-4 space-y-3">
          <Input
            placeholder="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border-border bg-muted/50"
          />
          <textarea
            placeholder="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-border bg-card shadow-card px-3 py-2 text-sm"
          />
          <div>
            <p className="mb-2 text-sm text-muted-foreground">TCG principal (opcional)</p>
            <GameSelector value={gameCode} onChange={setGameCode} />
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground/90">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
            />
            Comunidade privada
          </label>
        </div>
        <div className="mt-6 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            className="flex-1 bg-primary text-primary-foreground"
            disabled={!name.trim() || create.isPending}
            onClick={() => void create.mutate()}
          >
            {create.isPending ? "Criando…" : "Criar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
