"use client";

import { useEffect, useState } from "react";
import { subscribeToasts, type ToastPayload } from "@/lib/toast";
import { cn } from "@/lib/utils";

export function JudgeToast() {
  const [toast, setToast] = useState<ToastPayload | null>(null);

  useEffect(() => {
    return subscribeToasts((t) => {
      setToast(t);
      window.setTimeout(() => setToast(null), 3200);
    });
  }, []);

  if (!toast) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-20 left-1/2 z-[60] -translate-x-1/2 md:bottom-6"
      role="status"
      aria-live="polite"
    >
      <p
        className={cn(
          "rounded-full px-4 py-2 text-sm font-medium shadow-lg backdrop-blur-md",
          toast.kind === "success" && "bg-primary/95 text-primary-foreground",
          toast.kind === "error" && "bg-red-600/95 text-foreground",
          toast.kind === "info" && "bg-[var(--tcg-surface-elevated)] text-[var(--tcg-text-primary)] border border-[var(--tcg-border)]",
        )}
      >
        {toast.message}
      </p>
    </div>
  );
}
