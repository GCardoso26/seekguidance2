"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState } from "react";
import { X } from "lucide-react";
import { ROLE_LABELS } from "@/lib/seller-rbac";
import {
  useTeamUsers,
  useUpdateTeamRole,
  type TeamUserRow,
} from "@/hooks/useSellerTeam";
import { UserPermissionsMatrix } from "./UserPermissionsMatrix";

const TABS = ["Dados", "Permissões", "Logs"] as const;
const ROLES = ["manager", "operator", "stock_keeper", "support", "finance", "marketing"] as const;

function UserDetailDrawer({
  user,
  open,
  onOpenChange,
}: {
  user: TeamUserRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Dados");
  const updateRole = useUpdateTeamRole();
  const name = user?.display_name ?? user?.profile_name ?? user?.invited_email ?? "Membro";

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col border-l border-border bg-background shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <Dialog.Title className="text-lg font-semibold">
              {name} — {ROLE_LABELS[user?.role ?? "operator"]}
            </Dialog.Title>
            <Dialog.Close aria-label="Fechar" className="rounded p-1 hover:bg-muted">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>
          {user && (
            <>
              <div className="flex gap-1 border-b border-border px-2 py-2">
                {TABS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`rounded px-2 py-1 text-xs ${
                      tab === t ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto p-4 text-sm">
                {tab === "Dados" && (
                  <div className="space-y-2">
                    <p>E-mail: {user.invited_email ?? "—"}</p>
                    <p>Handle: {user.handle ? `@${user.handle}` : "—"}</p>
                    {!user.is_owner && (
                      <label className="block pt-2">
                        Função
                        <select
                          value={user.role}
                          onChange={(e) =>
                            updateRole.mutate({ userId: user.user_id, role: e.target.value })
                          }
                          className="mt-1 w-full rounded border border-border bg-card shadow-card px-3 py-2"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABELS[r]}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                  </div>
                )}
                {tab === "Permissões" && <UserPermissionsMatrix user={user} />}
                {tab === "Logs" && (
                  <p className="text-muted-foreground">Logs individuais em breve. Veja a aba Logs da equipe.</p>
                )}
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function TeamUsersTable() {
  const { data, isLoading } = useTeamUsers();
  const [selected, setSelected] = useState<TeamUserRow | null>(null);
  const users = data?.users ?? [];

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando equipe…</p>;

  return (
    <>
      <table className="w-full text-sm" data-testid="team-users-table">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="py-2 pr-4">Nome</th>
            <th className="py-2 pr-4">Função</th>
            <th className="py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr
              key={u.user_id}
              className="cursor-pointer border-b border-white/5 hover:bg-muted/80"
              onClick={() => setSelected(u)}
            >
              <td className="py-2 pr-4">
                {u.display_name ?? u.profile_name ?? u.invited_email ?? u.user_id}
              </td>
              <td className="py-2 pr-4">{ROLE_LABELS[u.role] ?? u.role}</td>
              <td className="py-2">{u.is_active !== false ? "Ativo" : "Inativo"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <UserDetailDrawer
        user={selected}
        open={Boolean(selected)}
        onOpenChange={(o) => !o && setSelected(null)}
      />
    </>
  );
}
