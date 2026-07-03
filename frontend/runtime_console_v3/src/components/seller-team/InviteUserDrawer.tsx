"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { X } from "lucide-react";
import { ROLE_LABELS } from "@/lib/seller-rbac";
import { useInviteTeamUser } from "@/hooks/useSellerTeam";

const ROLES = ["manager", "operator", "stock_keeper", "support", "finance", "marketing"] as const;

export function InviteUserDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("operator");
  const invite = useInviteTeamUser();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await invite.mutateAsync({ email, role });
    setEmail("");
    onOpenChange(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/10 bg-luxury-onyx shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <Dialog.Title className="text-lg font-semibold">Convidar membro</Dialog.Title>
            <Dialog.Close aria-label="Fechar" className="rounded p-1 hover:bg-white/10">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 p-4">
            <label className="text-sm">
              E-mail
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded border border-white/10 bg-white/5 px-3 py-2"
                placeholder="nome@loja.com"
              />
            </label>
            <label className="text-sm">
              Função
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 w-full rounded border border-white/10 bg-white/5 px-3 py-2"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={invite.isPending}
              className="mt-auto rounded bg-luxury-gold px-4 py-2 font-medium text-black disabled:opacity-50"
            >
              {invite.isPending ? "Enviando…" : "Enviar convite"}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
