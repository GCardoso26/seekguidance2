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

const itemClass = cn(
  "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-luxury-frost/90 outline-none",
  "hover:bg-white/10 hover:text-luxury-frost focus:bg-white/10 focus:text-luxury-frost",
);

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
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-0.5 pr-2 transition hover:border-luxury-gold/30 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold/40 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
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
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-luxury-midnight text-xs font-bold text-luxury-frost">
              {name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <span className="hidden max-w-[100px] truncate text-xs font-medium text-luxury-frost sm:inline">
            {name}
          </span>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={8}
          align="end"
          className="z-50 min-w-[200px] overflow-hidden rounded-xl border border-white/10 bg-luxury-obsidian p-1 shadow-xl animate-in fade-in-0 zoom-in-95"
        >
          <p className="truncate px-3 py-2 text-xs text-luxury-mist" title={user.email ?? ""}>
            {user.email}
          </p>
          <DropdownMenu.Separator className="my-1 h-px bg-white/10" />
          <DropdownMenu.Item asChild>
            <Link href="/player/me" className={itemClass}>
              <User className="h-4 w-4" aria-hidden />
              Perfil
            </Link>
          </DropdownMenu.Item>
          {onHistoryClick ? (
            <DropdownMenu.Item className={itemClass} onSelect={onHistoryClick}>
              <Clock className="h-4 w-4" aria-hidden />
              Histórico
            </DropdownMenu.Item>
          ) : (
            <DropdownMenu.Item asChild>
              <Link href="/player/me/history" className={itemClass}>
                <Clock className="h-4 w-4" aria-hidden />
                Histórico
              </Link>
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Item asChild>
            <Link href="/pricing?from=menu" className={itemClass}>
              <CreditCard className="h-4 w-4" aria-hidden />
              Assinatura
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-white/10" />
          <DropdownMenu.Item
            className={cn(itemClass, "hover:text-red-300 focus:text-red-300")}
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
