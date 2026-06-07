"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useChat() {
  const qc = useQueryClient();
  const [activeFriend, setActiveFriend] = useState<string | null>(null);

  const { data: friends = [] } = useQuery({
    queryKey: ["friends"],
    queryFn: async () => {
      const res = await fetch("/api/social/friends");
      if (!res.ok) return [];
      return res.json();
    },
    refetchInterval: 15_000,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", activeFriend],
    queryFn: async () => {
      if (!activeFriend) return [];
      const res = await fetch(`/api/social/messages/${encodeURIComponent(activeFriend)}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: Boolean(activeFriend),
    refetchInterval: 3_000,
  });

  const sendMessage = useMutation({
    mutationFn: async ({ receiverId, content }: { receiverId: string; content: string }) => {
      const res = await fetch("/api/social/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiver_id: receiverId, content }),
      });
      if (!res.ok) throw new Error("Falha ao enviar");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages", activeFriend] });
      qc.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/^http/, "ws");
    if (!base) return;
    try {
      const ws = new WebSocket(`${base}/runtime/judge/social/ws`);
      ws.onmessage = () => {
        qc.invalidateQueries({ queryKey: ["messages"] });
        qc.invalidateQueries({ queryKey: ["friends"] });
      };
      const ping = setInterval(() => ws.readyState === 1 && ws.send(JSON.stringify({ type: "ping" })), 30_000);
      return () => {
        clearInterval(ping);
        ws.close();
      };
    } catch {
      return undefined;
    }
  }, [qc]);

  return { friends, messages, activeFriend, setActiveFriend, sendMessage };
}
