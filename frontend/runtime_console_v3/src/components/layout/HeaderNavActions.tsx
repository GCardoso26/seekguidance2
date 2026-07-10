"use client";

import Link from "next/link";
import { ArrowLeftRight, ShoppingCart, Store } from "lucide-react";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { cn } from "@/lib/utils";

export function HeaderNavActions() {
  const { user } = useJudgeAuth();

  return (
    <nav className="hidden items-center gap-0.5 md:flex" aria-label="Comprar e vender">
      <Link
        href="/loja"
        data-testid="nav-buy"
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
        )}
      >
        <ShoppingCart className="h-4 w-4" />
        <span>Comprar</span>
      </Link>
      <Link
        href={user ? "/vendedor/painel" : "/entrar?redirect=/vendedor/painel"}
        data-testid="nav-sell"
        className={cn(
          "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
        )}
      >
        <Store className="h-4 w-4" />
        <span>Vender</span>
      </Link>
      <button
        type="button"
        disabled
        title="Em breve"
        data-testid="nav-trade"
        className="flex cursor-not-allowed items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground/50 opacity-60"
      >
        <ArrowLeftRight className="h-4 w-4" />
        <span>Trocar</span>
      </button>
    </nav>
  );
}
