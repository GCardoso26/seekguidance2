"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, Input } from "@/src/components/ui";
import { Analytics } from "@/src/analytics/events";

export function SearchForm({
  initialQuery = "",
  autoFocus = false,
}: {
  initialQuery?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (!trimmed) return;
    Analytics.track("buyer_search", { q: trimmed });
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex gap-2" role="search">
      <Input
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar carta (ex.: Lightning Bolt)"
        aria-label="Buscar carta"
        autoFocus={autoFocus}
        className="flex-1"
      />
      <Button type="submit">Buscar</Button>
    </form>
  );
}
