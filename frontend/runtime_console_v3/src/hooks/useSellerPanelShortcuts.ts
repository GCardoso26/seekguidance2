"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

type Options = {
  onOpenShortcuts: () => void;
  enabled?: boolean;
};

function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return el.isContentEditable;
}

/** Atalhos operacionais do painel vendedor (Sprint 10 Epic 4). */
export function useSellerPanelShortcuts({
  onOpenShortcuts,
  enabled = true,
}: Options) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    function onKey(e: KeyboardEvent) {
      if (isEditableTarget(e.target)) return;

      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key.toLowerCase() === "/") {
        e.preventDefault();
        onOpenShortcuts();
        return;
      }

      if (!mod || e.shiftKey || e.altKey) {
        if (e.key === "?" && !mod) {
          e.preventDefault();
          onOpenShortcuts();
        }
        return;
      }

      switch (e.key.toLowerCase()) {
        case "n":
          e.preventDefault();
          router.push("/vendedor/painel/listagens/nova");
          break;
        case "p":
          e.preventDefault();
          router.push("/vendedor/painel/pedidos");
          break;
        case "i":
          e.preventDefault();
          router.push("/vendedor/painel/estoque");
          break;
        case "t":
          e.preventDefault();
          router.push("/vendedor/painel/atendimento/tickets");
          break;
        default:
          break;
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, onOpenShortcuts, router]);
}
