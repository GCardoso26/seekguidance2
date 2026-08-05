"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Clock,
  FlaskConical,
  Gavel,
  Heart,
  Layers,
  LogOut,
  Package,
  Settings,
  Store,
  Trophy,
  User,
  Users,
  Wallet,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { useSellerStore } from "@/hooks/useSellerStore";
import { useSandboxEntitlements } from "@/hooks/useSandboxEntitlements";
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
  "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground/90 outline-none",
  "hover:bg-muted hover:text-foreground focus:bg-muted focus:text-foreground",
);

type Props = {
  onHistoryClick?: () => void;
};

export function UserMenu({ onHistoryClick }: Props = {}) {
  const { user, signOut, configured } = useJudgeAuth();
  const { store } = useSellerStore();
  const sandbox = useSandboxEntitlements();

  if (!configured || !user) return null;

  const photo = avatarUrl(user);
  const name = displayName(user);
  const isSeller = Boolean(store?.id);
  const showSell = isSeller || sandbox.elevated || sandbox.allFeaturesUnlocked;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          data-testid="user-menu"
          className="flex items-center gap-2 rounded-full border border-border bg-card shadow-card p-0.5 pr-2 transition hover:border-primary/30 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
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
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
              {name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <span
            className="hidden max-w-[100px] truncate text-xs font-medium text-foreground sm:inline"
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
          className="z-50 min-w-[220px] overflow-hidden rounded-xl border border-border bg-card p-1 shadow-xl animate-in fade-in-0 zoom-in-95"
        >
          <p className="truncate px-3 py-2 text-xs text-muted-foreground" title={user.email ?? ""}>
            {user.email}
          </p>
          <DropdownMenu.Separator className="my-1 h-px bg-muted" />
          <DropdownMenu.Item asChild>
            <Link href="/perfil" className={itemClass}>
              <User className="h-4 w-4" aria-hidden />
              Perfil
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild>
            <Link href="/colecao" className={itemClass}>
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
          <DropdownMenu.Separator className="my-1 h-px bg-muted" />
          <p className="px-3 py-1 text-caption font-semibold uppercase tracking-wide text-muted-foreground">
            Ecossistema
          </p>
          <DropdownMenu.Item asChild>
            <Link href="/search/torneios" className={itemClass} data-testid="nav-eventos">
              <Trophy className="h-4 w-4" aria-hidden />
              Eventos
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild>
            <Link href="/decks" className={itemClass}>
              <Layers className="h-4 w-4" aria-hidden />
              Deck Builder
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Item asChild>
            <Link href="/judge" className={itemClass}>
              <Gavel className="h-4 w-4" aria-hidden />
              Judge
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
          {showSell && (
            <DropdownMenu.Item asChild>
              <Link href="/vendedor/painel" className={itemClass} data-testid="nav-sell-menu">
                <Store className="h-4 w-4" aria-hidden />
                {isSeller ? "Painel do Vendedor" : "Vender"}
              </Link>
            </DropdownMenu.Item>
          )}
          {sandbox.elevated && (
            <>
              <DropdownMenu.Separator className="my-1 h-px bg-muted" />
              <p className="px-3 py-1 text-caption font-semibold uppercase tracking-wide text-muted-foreground">
                Admin Sandbox
              </p>
              <DropdownMenu.Item asChild>
                <Link href="/vendedor/painel/eventos" className={itemClass}>
                  <Calendar className="h-4 w-4" aria-hidden />
                  Eventos Demo
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <Link href="/vendedor/painel/torneios" className={itemClass}>
                  <FlaskConical className="h-4 w-4" aria-hidden />
                  Tournament Demo
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <Link href="/comprador/financeiro" className={itemClass}>
                  <Wallet className="h-4 w-4" aria-hidden />
                  Wallet Demo
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <Link href="/vendedor/painel/financeiro-platform" className={itemClass}>
                  <Wallet className="h-4 w-4" aria-hidden />
                  Financial Demo
                </Link>
              </DropdownMenu.Item>
              <DropdownMenu.Item asChild>
                <Link href="/vendedor/painel/estatisticas" className={itemClass}>
                  <FlaskConical className="h-4 w-4" aria-hidden />
                  Analytics Demo
                </Link>
              </DropdownMenu.Item>
            </>
          )}
          <DropdownMenu.Item asChild>
            <Link href="/settings/notifications" className={itemClass}>
              <Settings className="h-4 w-4" aria-hidden />
              Configurações
            </Link>
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-muted" />
          <DropdownMenu.Item
            className={cn(itemClass, "hover:text-danger focus:text-danger")}
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
