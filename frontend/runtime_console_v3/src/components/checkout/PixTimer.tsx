"use client";

import { useEffect, useState } from "react";

type Props = {
  expiresAt: string;
  onExpired?: () => void;
};

function formatRemaining(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function PixTimer({ expiresAt, onExpired }: Props) {
  const [remaining, setRemaining] = useState(() => new Date(expiresAt).getTime() - Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      const next = new Date(expiresAt).getTime() - Date.now();
      setRemaining(next);
      if (next <= 0) {
        onExpired?.();
        clearInterval(id);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt, onExpired]);

  const mins = remaining / 60000;
  const color = mins <= 1 ? "text-red-400" : mins <= 5 ? "text-orange-400" : "text-emerald-400";

  return (
    <p className={`text-sm font-mono ${color}`}>
      Expira em {formatRemaining(remaining)}
    </p>
  );
}
