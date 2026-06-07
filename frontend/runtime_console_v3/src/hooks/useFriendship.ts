"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

async function fetchStatus(playerId: string): Promise<string> {
  const res = await fetch(`/api/social/friends/${encodeURIComponent(playerId)}/status`);
  if (!res.ok) return "none";
  const data = await res.json();
  return data.status ?? "none";
}

export function useFriendship(playerId: string) {
  const qc = useQueryClient();
  const { data: status = "none" } = useQuery({
    queryKey: ["friendship", playerId],
    queryFn: () => fetchStatus(playerId),
    enabled: Boolean(playerId),
  });

  const sendRequest = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/social/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_id: playerId }),
      });
      if (!res.ok) throw new Error("Falha ao enviar solicitação");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["friendship", playerId] }),
  });

  const acceptRequest = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/social/friends/${encodeURIComponent(playerId)}/accept`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Falha ao aceitar");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["friendship", playerId] }),
  });

  const removeFriend = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/social/friends/${encodeURIComponent(playerId)}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao remover");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["friendship", playerId] }),
  });

  return { status, sendRequest, acceptRequest, removeFriend };
}
