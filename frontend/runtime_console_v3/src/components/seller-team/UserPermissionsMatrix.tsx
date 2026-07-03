"use client";

import { useMemo, useState } from "react";
import {
  ACTION_LABELS,
  MODULE_LABELS,
  mergePermissions,
  ROLE_DEFAULTS,
  type PermissionMatrix,
} from "@/lib/seller-rbac";
import { useUpdateTeamPermissions, type TeamUserRow } from "@/hooks/useSellerTeam";

const MODULE_ORDER = [
  "orders",
  "customers",
  "inventory",
  "catalog",
  "tickets",
  "finance",
  "settings",
  "team",
  "marketing",
] as const;

const ACTION_ORDER = ["view", "create", "edit", "delete", "export", "approve"] as const;

export function UserPermissionsMatrix({
  user,
  onSaved,
}: {
  user: TeamUserRow;
  onSaved?: () => void;
}) {
  const updatePerms = useUpdateTeamPermissions();
  const base = useMemo(
    () => mergePermissions(user.role, user.permissions ?? null),
    [user.role, user.permissions],
  );
  const [draft, setDraft] = useState<PermissionMatrix>(base);

  function toggle(module: string, action: string) {
    setDraft((prev) => ({
      ...prev,
      [module]: { ...prev[module], [action]: !prev[module]?.[action] },
    }));
  }

  function resetToRole() {
    setDraft(structuredClone(ROLE_DEFAULTS[user.role] ?? ROLE_DEFAULTS.operator));
  }

  async function save() {
    await updatePerms.mutateAsync({ userId: user.user_id, permissions: draft });
    onSaved?.();
  }

  if (user.is_owner) {
    return <p className="text-sm text-luxury-mist">Proprietário tem acesso total.</p>;
  }

  return (
    <div className="space-y-4" data-testid="user-permissions-matrix">
      {MODULE_ORDER.map((module) => {
        const actions = ACTION_ORDER.filter((a) => base[module]?.[a] !== undefined || draft[module]?.[a] !== undefined);
        if (actions.length === 0) return null;
        return (
          <div key={module}>
            <h4 className="mb-2 font-medium" aria-label={MODULE_LABELS[module]}>
              {MODULE_LABELS[module]}
            </h4>
            <div className="flex flex-wrap gap-3">
              {actions.map((action) => (
                <label key={action} className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(draft[module]?.[action])}
                    onChange={() => toggle(module, action)}
                    aria-label={`${MODULE_LABELS[module]} — ${ACTION_LABELS[action]}`}
                  />
                  {ACTION_LABELS[action]}
                </label>
              ))}
            </div>
          </div>
        );
      })}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={save}
          disabled={updatePerms.isPending}
          className="rounded bg-luxury-gold px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
        >
          Salvar alterações
        </button>
        <button
          type="button"
          onClick={resetToRole}
          className="rounded border border-white/20 px-4 py-2 text-sm hover:bg-white/5"
        >
          Restaurar padrão da função
        </button>
      </div>
    </div>
  );
}
