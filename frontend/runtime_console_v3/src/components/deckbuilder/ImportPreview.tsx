"use client";

import type { ParsedCard } from "@/lib/deck-parser";
import { Check, AlertTriangle, X } from "lucide-react";

interface ImportPreviewProps {
  items: ParsedCard[];
}

export function ImportPreview({ items }: ImportPreviewProps) {
  if (items.length === 0) {
    return <p className="text-sm text-luxury-mist">Cole uma lista para ver o preview.</p>;
  }

  return (
    <ul className="max-h-56 space-y-2 overflow-y-auto text-sm">
      {items.map((item, idx) => {
        const key = `${item.name}-${idx}`;
        if (item.error) {
          return (
            <li key={key} className="flex items-center gap-2 text-red-400">
              {item.error === "Não encontrado" ? <X className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              <span>
                {item.quantity > 0 ? `${item.quantity}x ` : ""}
                {item.name} — {item.error}
              </span>
            </li>
          );
        }
        return (
          <li key={key} className="flex items-center gap-2 text-emerald-300">
            <Check className="h-4 w-4" />
            <span>
              {item.quantity}x {item.found?.name ?? item.name}
              {item.isSideboard ? " (sideboard)" : ""}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
