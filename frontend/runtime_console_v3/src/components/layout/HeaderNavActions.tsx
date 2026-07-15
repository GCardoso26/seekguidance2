"use client";

import Link from "next/link";
import { Store } from "lucide-react";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { entrarPath } from "@/lib/auth/entrar-path";
import { cn } from "@/lib/utils";

/** CTA secundário — painel do vendedor (BP5: next=, não redirect=). */
export function HeaderNavActions() {
  const { user } = useJudgeAuth();

  return (
    <nav className="flex shrink-0 items-center gap-0.5" aria-label="Ações da loja">
      <Link
        href={user ? "/vendedor/painel" : entrarPath("/vendedor/painel")}
        data-testid="nav-sell"
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        )}
      >
        <Store className="h-4 w-4" aria-hidden />
        <span>Vender</span>
      </Link>
    </nav>
  );
}
