"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Clock, CreditCard, LogOut, User } from "lucide-react";
import Link from "next/link";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { cn } from "@/lib/utils";

type Props = {
  onHistoryClick?: () => void;
};

function avatarUrl(user: { user_metadata?: Record<string, unknown> }): string | null {
  const url = user.user_metadata?.avatar_url ?? user.user_metadata?.picture;
  return typeof url === "string" ? url : null;
}

function displayName(user: { email?: string | null; user_metadata?: Record<string, unknown> }): string {
  const meta = user.user_metadata;
  const full = meta?.full_name ?? meta?.name;
  if (typeof full === "string" && full.trim()) return full.trim();
  return user.email?.split("@")[0] ?? "Conta";
}

export function UserMenu({ onHistoryClick }: Props) {
  const { user, signOut, configured } = useJudgeAuth();

  if (!configured || !user) return null;

  const photo = avatarUrl(user);
  const name = displayName(user);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 p-0.5 pr-2 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          aria-label={`Menu da conta de ${name}`}
        >
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt=""
              className="h-8 w-8 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-slate-100">
              {name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="hidden max-w-[100px] truncate text-xs font-medium text-slate-100 sm:inline">
            {name}
          </span>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={8}
          align="end"
          className="z-50 min-w-[200px] overflow-hidden rounded-xl border border-slate-700 bg-slate-900 p-1 shadow-xl animate-in fade-in-0 zoom-in-95"
        >
              <p className="truncate px-3 py-2 text-xs text-slate-400" title={user.email ?? ""}>
                {user.email}
              </p>
              <DropdownMenu.Separator className="my-1 h-px bg-slate-700" />
              <DropdownMenu.Item asChild>
                <Link
                  href="/player/me"
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none",
                    "hover:bg-slate-800 hover:text-slate-100 focus:bg-slate-800 focus:text-slate-100",
                  )}
                >
                  <User className="h-4 w-4" aria-hidden />
                  Perfil
                </Link>
              </DropdownMenu.Item>
              {onHistoryClick ? (
                <DropdownMenu.Item
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none",
                    "hover:bg-slate-800 hover:text-slate-100 focus:bg-slate-800 focus:text-slate-100",
                  )}
                  onSelect={onHistoryClick}
                >
                  <Clock className="h-4 w-4" aria-hidden />
                  Histórico
                </DropdownMenu.Item>
              ) : (
                <DropdownMenu.Item asChild>
                  <Link
                    href="/player/me/history"
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none",
                      "hover:bg-slate-800 hover:text-slate-100 focus:bg-slate-800 focus:text-slate-100",
                    )}
                  >
                    <Clock className="h-4 w-4" aria-hidden />
                    Histórico
                  </Link>
                </DropdownMenu.Item>
              )}
              <DropdownMenu.Item asChild>
                <Link
                  href="/pricing?from=menu"
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none",
                    "hover:bg-slate-800 hover:text-slate-100 focus:bg-slate-800 focus:text-slate-100",
                  )}
                >
                  <CreditCard className="h-4 w-4" aria-hidden />
                  Assinatura
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 h-px bg-slate-700" />
              <DropdownMenu.Item
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none",
                  "hover:bg-slate-800 hover:text-red-300 focus:bg-slate-800 focus:text-red-300",
                )}
                onSelect={() => void signOut()}
              >
                <LogOut className="h-4 w-4" aria-hidden />
                Sair
              </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
