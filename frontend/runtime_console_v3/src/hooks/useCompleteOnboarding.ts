"use client";

import { useCallback } from "react";
import { suggestHandleFromEmail } from "@/hooks/useCreateProfile";
import type { User } from "@supabase/supabase-js";
import type { TcgType } from "@/types/judge";

export async function completeOnboarding(user: User, favoriteTcgs: TcgType[]): Promise<void> {
  const body = {
    favorite_tcgs: favoriteTcgs,
    favorite_game: favoriteTcgs[0],
    has_completed_onboarding: true,
  };

  let res = await fetch("/api/players/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status === 404) {
    const displayName =
      (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
      user.email?.split("@")[0] ||
      "Jogador";
    const createRes = await fetch("/api/players/me", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        handle: suggestHandleFromEmail(user.email ?? user.id),
        display_name: displayName,
        favorite_game: favoriteTcgs[0],
      }),
    });
    if (!createRes.ok) {
      const err = (await createRes.json().catch(() => ({}))) as { detail?: string };
      throw new Error(err.detail ?? "Não foi possível criar o perfil");
    }
    res = await fetch("/api/players/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(err.detail ?? "Falha ao salvar onboarding");
  }
}

export function useCompleteOnboarding() {
  return useCallback(completeOnboarding, []);
}
