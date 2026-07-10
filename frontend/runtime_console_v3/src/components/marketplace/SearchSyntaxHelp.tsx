"use client";

import { HelpCircle } from "lucide-react";

export function SearchSyntaxHelp() {
  return (
    <details className="mt-2 text-xs text-muted-foreground">
      <summary className="flex cursor-pointer items-center gap-1 text-primary">
        <HelpCircle className="h-3.5 w-3.5" />
        Sintaxe de busca
      </summary>
      <ul className="mt-2 list-inside list-disc space-y-1">
        <li>
          <code>name:&quot;Sol Ring&quot;</code> — nome exato
        </li>
        <li>
          <code>set:cmd</code> — código do set
        </li>
        <li>
          <code>color:U</code> — cor (MTG)
        </li>
        <li>
          <code>cmc&lt;=3</code> — custo de mana
        </li>
      </ul>
    </details>
  );
}
