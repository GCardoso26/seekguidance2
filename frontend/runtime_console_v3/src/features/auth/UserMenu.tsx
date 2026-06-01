"use client";

import { useJudgeAuth } from "@/features/auth/AuthProvider";

export function UserMenu() {
  const { user, signOut, configured } = useJudgeAuth();

  if (!configured || !user) return null;

  const label = user.email?.split("@")[0] ?? "Conta";

  return (
    <div className="flex items-center gap-2">
      <span className="max-w-[120px] truncate text-xs text-[hsl(222_15%_50%)]" title={user.email ?? ""}>
        {label}
      </span>
      <button
        type="button"
        onClick={() => void signOut()}
        className="rounded-full border border-[hsl(var(--border))] px-2.5 py-1 text-[10px] font-semibold text-[hsl(222_20%_35%)] hover:bg-[hsl(var(--muted))]"
      >
        Sair
      </button>
    </div>
  );
}
