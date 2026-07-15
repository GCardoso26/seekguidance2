"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import Link from "next/link";
import { ChevronDown, Compass } from "lucide-react";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { cn } from "@/lib/utils";

const EXPLORE_LINKS = [
  { href: "/search", label: "Torneios" },
  { href: "/marketplace", label: "Lojas" },
  { href: "/social", label: "Social" },
] as const;

type Props = {
  className?: string;
};

export function LandingExploreNav({ className }: Props) {
  const { user } = useJudgeAuth();
  const profileHref = user ? "/perfil" : "/#login-section";

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 text-sm font-medium text-slate-400 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50",
            className,
          )}
          aria-label="Menu de seções"
        >
          <Compass className="h-4 w-4" aria-hidden />
          Seções
          <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={8}
          align="start"
          className="z-50 min-w-[180px] rounded-xl border border-slate-700 bg-slate-900 p-1 shadow-xl"
        >
          {EXPLORE_LINKS.map((item) => (
            <DropdownMenu.Item key={item.href} asChild>
              <Link
                href={item.href}
                className="flex cursor-pointer rounded-lg px-3 py-2 text-sm text-slate-300 outline-none hover:bg-slate-800 hover:text-slate-100"
              >
                {item.label}
              </Link>
            </DropdownMenu.Item>
          ))}
          <DropdownMenu.Separator className="my-1 h-px bg-slate-700" />
          <DropdownMenu.Item asChild>
            <Link
              href={profileHref}
              className="flex cursor-pointer rounded-lg px-3 py-2 text-sm text-slate-300 outline-none hover:bg-slate-800 hover:text-slate-100"
            >
              Perfil
            </Link>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
