"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export type UpdateProfileData = {
  displayName?: string;
  bio?: string;
  favoriteGame?: string;
  city?: string;
  country?: string;
  avatarUrl?: string;
};

function toApiBody(data: UpdateProfileData) {
  return {
    display_name: data.displayName,
    bio: data.bio,
    favorite_game: data.favoriteGame,
    city: data.city,
    country: data.country,
    avatar_url: data.avatarUrl,
  };
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
        const error = await res.json().catch(() => ({}));
        throw new Error(String(error.detail ?? error.message ?? "Falha ao atualizar perfil"));
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["player-profile", "me"] });
    },
  });
}
