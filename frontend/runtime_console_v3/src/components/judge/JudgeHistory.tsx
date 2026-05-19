"use client";
import type { JudgeHistoryItem } from "@/types/judge";
import { cn } from "@/lib/utils";

type Props = {
  items: JudgeHistoryItem[];
  onSelect?: (item: JudgeHistoryItem) => void;
  onClear?: () => void;
};

export function JudgeHistory({ items, onSelect, onClear }: Props) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground text-center">
        Nenhuma pergunta nesta sessão ainda.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Histórico</p>
        {onClear && (
          <button type="button" onClick={onClear} className="text-xs text-primary hover:underline">
            Limpar
          </button>
        )}
      </div>
      <ul className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect?.(item)}
              className={cn(
                "w-full text-left rounded-lg border border-border bg-card/40 px-3 py-2 hover:bg-muted/50 transition",
              )}
            >
              <p className="text-xs text-muted-foreground truncate">{item.question}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {new Date(item.createdAt).toLocaleString("pt-BR")}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
