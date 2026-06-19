"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TcgType } from "@/types/judge";

export type UpdateProfileData = {
  displayName?: string;
  bio?: string;
  favoriteGame?: string;
  favoriteTcgs?: TcgType[];
  hasCompletedOnboarding?: boolean;
  birthDate?: string;
  state?: string;
  city?: string;
  country?: string;
  avatarUrl?: string;
};

function toApiBody(data: UpdateProfileData): Record<string, unknown> {
  const raw: Record<string, unknown> = {
    display_name: data.displayName,
    bio: data.bio,
    favorite_game: data.favoriteGame,
    favorite_tcgs: data.favoriteTcgs,
    has_completed_onboarding: data.hasCompletedOnboarding,
    birth_date: data.birthDate || undefined,
    state: data.state,
    city: data.city,
    country: data.country,
    avatar_url: data.avatarUrl,
  };
  return Object.fromEntries(
    Object.entries(raw).filter(([, value]) => value !== undefined && value !== null),
  );
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const res = await fetch("/api/players/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toApiBody(data)),
      });
      if (!res.ok) {
        const error = (await res.json().catch(() => ({}))) as { detail?: unknown; message?: string };
        const detail =
          typeof error.detail === "string"
            ? error.detail
            : Array.isArray(error.detail)
              ? error.detail.map((d) => (typeof d === "object" && d && "msg" in d ? String(d.msg) : String(d))).join("; ")
              : error.message;
        throw new Error(detail || "Falha ao atualizar perfil");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["player-profile", "me"] });
    },
  });
}
