"use client";

import { useEffect, useState } from "react";

export type TimerStatus = "pending" | "running" | "paused" | "extended" | "ended";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function useRoundTimer(roundId: string | null, apiBase = "") {
  const [remaining, setRemaining] = useState(0);
  const [status, setStatus] = useState<TimerStatus>("pending");

  useEffect(() => {
    if (!roundId) return;

    const base = apiBase || (typeof window !== "undefined" ? window.location.origin : "");
    const wsUrl = base.replace(/^http/, "ws") + `/api/tournament/timers/${roundId}/ws`;
    let ws: WebSocket | null = null;
    let es: EventSource | null = null;

    const apply = (data: { remainingSeconds?: number; status?: TimerStatus; type?: string }) => {
      if (typeof data.remainingSeconds === "number") setRemaining(data.remainingSeconds);
      if (data.status) setStatus(data.status);
    };

    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (ev) => {
        apply(JSON.parse(ev.data as string));
      };
      ws.onerror = () => {
        ws?.close();
        es = new EventSource(`/api/tournament/timers/${roundId}/stream`);
        es.onmessage = (ev) => {
          apply(JSON.parse(ev.data));
        };
      };
    } catch {
      es = new EventSource(`/api/tournament/timers/${roundId}/stream`);
      es.onmessage = (ev) => apply(JSON.parse(ev.data));
    }

    return () => {
      ws?.close();
      es?.close();
    };
  }, [roundId, apiBase]);

  return { remaining, status, formatted: formatTime(remaining) };
}
