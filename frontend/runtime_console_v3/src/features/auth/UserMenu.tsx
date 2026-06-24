"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Clock, Heart, LogOut, Package, Settings, Store, User, Users } from "lucide-react";
import Link from "next/link";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { useSellerStore } from "@/hooks/useSellerStore";
import { cn } from "@/lib/utils";

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

type Props = {
  onHistoryClick?: () => void;
};

export function UserMenu({ onHistoryClick }: Props = {}) {
  const { user, signOut, configured } = useJudgeAuth();
  const { store } = useSellerStore();

  if (!configured || !user) return null;

  const photo = avatarUrl(user);
  const name = displayName(user);
  const isSeller = Boolean(store?.id);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          data-testid="user-menu"
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-0.5 pr-2 transition hover:border-luxury-gold/30 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold/40"
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
          <span
            className="hidden max-w-[100px] truncate text-xs font-medium text-luxury-frost sm:inline"
            data-testid="profile-name"
          >
            {name}
          </span>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={8}
          align="end"
          className="z-50 min-w-[220px] overflow-hidden rounded-xl border border-white/10 bg-luxury-obsidian p-1 shadow-xl animate-in fade-in-0 zoom-in-95"
        >
          <p className="truncate px-3 py-2 text-xs text-luxury-mist" title={user.email ?? ""}>
            {user.email}
          </p>
          <DropdownMenu.Separator className="my-1 h-px bg-white/10" />
          <DropdownMenu.Item asChild>
            <Link href="/perfil" className={itemClass}>
              <User className="h-4 w-4" aria-hidden />
              Perfil
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild>
            <Link href="/perfil/colecao" className={itemClass}>
              <Heart className="h-4 w-4" aria-hidden />
              Coleção
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild>
            <Link href="/perfil/pedidos" className={itemClass}>
              <Package className="h-4 w-4" aria-hidden />
              Pedidos
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild>
            <Link href="/perfil/seguidos" className={itemClass}>
              <Users className="h-4 w-4" aria-hidden />
              Seguidos
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
          {isSeller && (
            <DropdownMenu.Item asChild>
              <Link href="/vendedor/painel" className={itemClass}>
                <Store className="h-4 w-4" aria-hidden />
                Painel do Vendedor
              </Link>
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Item asChild>
            <Link href="/settings/notifications" className={itemClass}>
              <Settings className="h-4 w-4" aria-hidden />
              Configurações
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
