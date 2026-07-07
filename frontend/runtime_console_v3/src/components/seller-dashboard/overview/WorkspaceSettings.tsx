"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { Settings2, X } from "lucide-react";
import {
  DASHBOARD_WIDGET_LABELS,
  DEFAULT_WIDGET_ORDER,
  type DashboardWidgetId,
} from "@/lib/seller-workspace-preferences";
import { useSellerWorkspacePreferences } from "@/hooks/useSellerWorkspacePreferences";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function WorkspaceSettingsDialog({ open, onOpenChange }: Props) {
  const { prefs, toggleWidget, togglePin, moveWidget, setDensity, setDefaultLanding, reset } =
    useSellerWorkspacePreferences();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/70" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[71] max-h-[85vh] w-[min(480px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-white/10 bg-luxury-onyx p-5">
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="font-semibold">Personalizar workspace</Dialog.Title>
            <Dialog.Close aria-label="Fechar" className="rounded p-1 hover:bg-white/10">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>

          <section className="mb-4 space-y-2">
            <h3 className="text-xs font-semibold uppercase text-luxury-mist">Página inicial</h3>
            <select
              value={prefs.defaultLanding}
              onChange={(e) => setDefaultLanding(e.target.value as typeof prefs.defaultLanding)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
            >
              <option value="/vendedor/painel">Dashboard</option>
              <option value="/vendedor/painel/operacao">Centro de operação</option>
            </select>
          </section>

          <section className="mb-4 space-y-2">
            <h3 className="text-xs font-semibold uppercase text-luxury-mist">Densidade das tabelas</h3>
            <div className="flex gap-2">
              {(["comfortable", "compact"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDensity(d)}
                  className={`rounded-lg px-3 py-1.5 text-xs ${
                    prefs.tableDensity === d ? "bg-luxury-gold text-luxury-onyx" : "bg-white/10"
                  }`}
                >
                  {d === "comfortable" ? "Confortável" : "Compacta"}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-xs font-semibold uppercase text-luxury-mist">Widgets do dashboard</h3>
            <ul className="space-y-2">
              {DEFAULT_WIDGET_ORDER.map((id: DashboardWidgetId) => {
                const hidden = prefs.hiddenWidgets.includes(id);
                const pinned = prefs.pinnedWidgets.includes(id);
                return (
                  <li
                    key={id}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2"
                  >
                    <span className="flex-1 text-sm">{DASHBOARD_WIDGET_LABELS[id]}</span>
                    <button
                      type="button"
                      onClick={() => moveWidget(id, "up")}
                      className="rounded border border-white/10 px-2 py-0.5 text-xs"
                      aria-label="Mover para cima"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveWidget(id, "down")}
                      className="rounded border border-white/10 px-2 py-0.5 text-xs"
                      aria-label="Mover para baixo"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => togglePin(id)}
                      className={`rounded px-2 py-0.5 text-xs ${pinned ? "bg-luxury-gold/30" : "border border-white/10"}`}
                    >
                      Fixar
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleWidget(id)}
                      className={`rounded px-2 py-0.5 text-xs ${hidden ? "bg-red-500/20" : "border border-white/10"}`}
                    >
                      {hidden ? "Oculto" : "Visível"}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <button
            type="button"
            onClick={reset}
            className="mt-4 w-full rounded-lg border border-white/15 py-2 text-xs text-luxury-mist"
          >
            Restaurar padrão
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function WorkspaceSettingsButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs hover:bg-white/5"
        data-testid="workspace-settings-btn"
      >
        <Settings2 className="h-3.5 w-3.5" />
        Personalizar
      </button>
      <WorkspaceSettingsDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
