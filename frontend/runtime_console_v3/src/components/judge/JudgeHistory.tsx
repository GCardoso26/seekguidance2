"use client";



import { useMemo, useState } from "react";

import type { CSSProperties } from "react";

import type { JudgeHistoryItem } from "@/types/judge";

import { getTcgBrand } from "@/lib/tcg-brand";

import { filterJudgeHistory, groupJudgeHistory } from "@/lib/judge-history-groups";

import { recordGrowthEvent } from "@/services/judgeGrowthApi";

import { cn } from "@/lib/utils";



type Props = {

  items: JudgeHistoryItem[];

  onSelect?: (item: JudgeHistoryItem) => void;

  onClear?: () => void;

};



export function JudgeHistory({ items, onSelect, onClear }: Props) {

  const [query, setQuery] = useState("");



  const filtered = useMemo(() => filterJudgeHistory(items, query), [items, query]);

  const groups = useMemo(() => groupJudgeHistory(filtered), [filtered]);



  if (items.length === 0) {

    return (

      <div className="rounded-xl border border-dashed border-[hsl(var(--border))] p-4 text-center text-sm text-[hsl(222_15%_50%)]">

        Nenhuma pergunta nesta sessão ainda.

      </div>

    );

  }



  return (

    <div className="space-y-2">

      <div className="flex items-center justify-between gap-2">

        <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(222_15%_45%)]">

          Histórico

        </p>

        {onClear && (

          <button

            type="button"

            onClick={onClear}

            className="text-xs font-semibold text-[hsl(var(--primary))] hover:underline"

          >

            Limpar

          </button>

        )}

      </div>

      <input

        type="search"

        value={query}

        onChange={(e) => setQuery(e.target.value)}

        onFocus={() => void recordGrowthEvent({ metric_type: "history_opened" })}

        placeholder="Pesquisar histórico…"

        className="w-full rounded-lg border border-[hsl(var(--border))] px-3 py-2 text-xs"

        aria-label="Pesquisar histórico"

      />

      <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1">

        {groups.map((group) => (

          <div key={group.label}>

            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-[hsl(222_15%_45%)]">

              {group.label}

            </p>

            <ul className="space-y-2">

              {group.items.map((item) => {

                const brand = getTcgBrand(item.tcg);

                const sourceCount = item.sources?.length ?? 0;



                return (

                  <li key={item.id}>

                    <button

                      type="button"

                      onClick={() => onSelect?.(item)}

                      style={

                        {

                          "--tcg-accent": brand.accent,

                          "--tcg-accent-fg": brand.accentFg,

                        } as CSSProperties

                      }

                      className={cn(

                        "w-full rounded-xl border border-[hsl(var(--border))] bg-white px-3 py-2.5 text-left transition",

                        "hover:border-[hsl(var(--tcg-accent)/0.35)] hover:shadow-sm",

                      )}

                    >

                      <div className="flex items-start gap-2">

                        <span

                          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[hsl(var(--tcg-accent))] text-[8px] font-black tracking-tight text-[hsl(var(--tcg-accent-fg))]"

                          title={brand.publisher}

                          aria-hidden

                        >

                          {brand.icon}

                        </span>

                        <div className="min-w-0 flex-1">

                          <p className="truncate text-xs font-medium text-[hsl(var(--foreground))]">

                            {item.question}

                          </p>

                          <p className="mt-0.5 text-[10px] text-[hsl(222_15%_50%)]">

                            {new Date(item.createdAt).toLocaleString("pt-BR")}

                            {sourceCount > 0 && (

                              <span>

                                {" "}

                                · {sourceCount} fonte{sourceCount !== 1 ? "s" : ""}

                              </span>

                            )}

                          </p>

                        </div>

                      </div>

                    </button>

                  </li>

                );

              })}

            </ul>

          </div>

        ))}

        {filtered.length === 0 && (

          <p className="text-center text-xs text-[hsl(222_15%_50%)]">Nenhum resultado.</p>

        )}

      </div>

    </div>

  );

}

