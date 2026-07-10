"use client";

import { useState } from "react";
import { RulingSearch } from "@/lib/rulings/RulingSearch";

const search = new RulingSearch();

export default function JudgeRulingsPage() {
  const [query, setQuery] = useState("");
  const [tcg, setTcg] = useState("lorcana");
  const results = search.search(query, { tcg: tcg as "lorcana", limit: 20 });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Base de Rulings</h2>
      <div className="flex flex-wrap gap-2">
        <input
          className="flex-1 min-w-[200px] surface-card rounded-lg px-3 py-2"
          placeholder="Buscar por texto, carta ou keyword..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="surface-card rounded-lg px-3 py-2"
          value={tcg}
          onChange={(e) => setTcg(e.target.value)}
        >
          <option value="lorcana">Lorcana</option>
        </select>
      </div>
      <ul className="space-y-3">
        {results.map((r) => (
          <li key={r.id} className="rounded-xl border border-border p-4">
            <div className="flex justify-between gap-2">
              <span className="font-medium">{r.title}</span>
              <span className="text-xs text-muted-foreground">{r.hierarchy}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{r.answer}</p>
            <p className="mt-2 text-xs text-muted-foreground/70">
              Status: {r.status} · {r.language}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
