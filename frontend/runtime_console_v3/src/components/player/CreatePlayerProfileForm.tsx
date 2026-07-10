"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { suggestHandleFromEmail, useCreateProfile } from "@/hooks/useCreateProfile";

type Props = {
  email?: string | null;
  defaultDisplayName?: string | null;
};

export function CreatePlayerProfileForm({ email, defaultDisplayName }: Props) {
  const { mutate: createProfile, isPending, isError, error } = useCreateProfile();
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState(defaultDisplayName ?? "");

  useEffect(() => {
    if (email && !handle) setHandle(suggestHandleFromEmail(email));
  }, [email, handle]);

  useEffect(() => {
    if (defaultDisplayName && !displayName) setDisplayName(defaultDisplayName);
  }, [defaultDisplayName, displayName]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProfile({
      handle: handle.trim().toLowerCase(),
      display_name: displayName.trim(),
    });
  };

  return (
    <Card className="mx-auto max-w-md border-border bg-muted/50">
      <CardHeader>
        <CardTitle>Criar seu perfil</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          Você ainda não tem perfil de jogador. Escolha um handle público para continuar.
        </p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="create-handle" className="mb-1 block text-sm text-foreground/90">
              Handle
            </label>
            <Input
              id="create-handle"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="seu_handle"
              pattern="[a-zA-Z0-9_]{3,30}"
              required
              className="border-border bg-muted/50"
            />
            <p className="mt-1 text-xs text-muted-foreground/70">3–30 caracteres: letras, números e _</p>
          </div>
          <div>
            <label htmlFor="create-displayName" className="mb-1 block text-sm text-foreground/90">
              Nome de exibição
            </label>
            <Input
              id="create-displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="border-border bg-muted/50"
            />
          </div>
          {isError && (
            <p className="text-sm text-danger">{error instanceof Error ? error.message : "Erro ao criar perfil"}</p>
          )}
          <Button type="submit" disabled={isPending} className="w-full bg-primary text-primary-foreground">
            {isPending ? "Criando…" : "Criar perfil"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
