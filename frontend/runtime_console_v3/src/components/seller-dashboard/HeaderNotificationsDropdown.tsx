"use client";



import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import Link from "next/link";

import { Bell } from "lucide-react";

import { useHeaderNotifications } from "@/hooks/useHeaderNotifications";

import { isFeatureEnabled } from "@/lib/feature-flags";

import { markAllInboxRead, loadInboxReadIds } from "@/lib/seller-operational-inbox";



export function HeaderNotificationsDropdown() {

  const { data, isLoading } = useHeaderNotifications(isFeatureEnabled("HEADER_NOTIFICATIONS"));

  const total = data?.total_unread ?? 0;

  const categories = data?.categories ?? [];



  if (!isFeatureEnabled("HEADER_NOTIFICATIONS")) return null;



  function handleMarkAllRead() {

    const readIds = loadInboxReadIds();

    const items = categories.map((cat) => ({

      id: `header-${cat.type}`,

      category: "system" as const,

      title: cat.label,

      description: "",

      href: cat.action,

      urgent: Boolean(cat.urgent),

      createdAt: new Date().toISOString(),

    }));

    markAllInboxRead(items, readIds);

  }



  return (

    <DropdownMenu.Root>

      <DropdownMenu.Trigger asChild>

        <button

          type="button"

          className="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10"

          aria-label={`Notificações${total > 0 ? `, ${total} não lidas` : ""}`}

          data-testid="header-notifications-bell"

        >

          <Bell className="h-5 w-5" aria-hidden />

          {total > 0 && (

            <span

              className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"

              data-testid="header-notifications-badge"

            >

              {total > 99 ? "99+" : total}

            </span>

          )}

        </button>

      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>

        <DropdownMenu.Content

          className="z-[62] w-80 rounded-xl border border-white/10 bg-luxury-onyx p-0 shadow-xl"

          sideOffset={8}

          align="end"

        >

          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">

            <h3 className="font-semibold">

              Notificações{total > 0 ? ` (${total})` : ""}

            </h3>

            <Link href="/vendedor/painel/inbox" className="text-xs text-luxury-gold hover:underline">

              Inbox →

            </Link>

          </div>

          <div className="max-h-80 overflow-y-auto p-2" data-testid="header-notifications-panel">

            {isLoading && <p className="p-3 text-sm text-luxury-mist">Carregando…</p>}

            {!isLoading && categories.length === 0 && (

              <p className="p-3 text-sm text-luxury-mist">Nenhuma notificação pendente.</p>

            )}

            {categories.map((cat) => (

              <div

                key={cat.type}

                className={`mb-2 rounded-lg p-3 ${cat.urgent ? "bg-red-500/10" : "bg-white/5"}`}

              >

                <p className={`text-sm font-medium ${cat.urgent ? "text-red-300" : ""}`}>

                  {cat.urgent ? "!" : "•"} {cat.label}

                </p>

                <Link

                  href={cat.action}

                  className="mt-1 inline-block text-xs text-luxury-gold underline"

                >

                  Ver detalhes →

                </Link>

              </div>

            ))}

          </div>

          {total > 0 && (

            <div className="border-t border-white/10 p-2">

              <DropdownMenu.Item

                className="w-full cursor-pointer rounded-lg py-2 text-center text-xs text-luxury-mist outline-none hover:bg-white/5"

                onSelect={handleMarkAllRead}

              >

                Marcar todas como lidas

              </DropdownMenu.Item>

            </div>

          )}

        </DropdownMenu.Content>

      </DropdownMenu.Portal>

    </DropdownMenu.Root>

  );

}


