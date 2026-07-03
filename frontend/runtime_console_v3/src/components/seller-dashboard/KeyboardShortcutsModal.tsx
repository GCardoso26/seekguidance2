"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

const SHORTCUTS = [
  { keys: "⌘ K / Ctrl K", action: "Busca global" },
  { keys: "?", action: "Atalhos de teclado" },
  { keys: "Esc", action: "Fechar modal ou drawer" },
  { keys: "↑ ↓", action: "Navegar resultados da busca" },
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function KeyboardShortcutsModal({ open, onOpenChange }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/70" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[61] w-[min(400px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/10 bg-luxury-onyx p-6 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">Atalhos de teclado</Dialog.Title>
            <Dialog.Close aria-label="Fechar" className="rounded p-1 hover:bg-white/10">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>
          <ul className="space-y-2 text-sm">
            {SHORTCUTS.map((s) => (
              <li key={s.keys} className="flex items-center justify-between gap-4">
                <span className="text-luxury-mist">{s.action}</span>
                <kbd className="rounded border border-white/20 px-2 py-0.5 font-mono text-xs">
                  {s.keys}
                </kbd>
              </li>
            ))}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function useKeyboardShortcutsModal() {
  if (typeof window === "undefined") return;
  // hook exported separately for layout
}
