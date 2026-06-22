"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface GlobalSearchBarProps {
  className?: string;
  placeholder?: string;
  defaultGame?: string;
}

export function GlobalSearchBar({
  className,
  placeholder = "Buscar cartas em todos os TCGs…",
  defaultGame,
}: GlobalSearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (defaultGame) params.set("game", defaultGame);
    const suffix = params.toString();
    router.push(suffix ? `/loja/busca?${suffix}` : "/loja/busca");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("mx-auto w-full max-w-2xl", className)}
      role="search"
      aria-label="Busca global de cartas"
    >
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="h-12 rounded-full border-border bg-card/80 pl-12 pr-4 text-base shadow-sm backdrop-blur-sm"
          aria-label="Termo de busca"
        />
      </div>
    </form>
  );
}
