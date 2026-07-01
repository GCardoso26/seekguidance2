"use client";

import { useState, useRef, useCallback } from "react";
import { useSearchSyntax } from "@/hooks/useSearchSyntax";
import { Search, X } from "lucide-react";

const SYNTAX_SUGGESTIONS = [
  { field: "name", example: 'name:"Sol Ring"', description: "Nome da carta" },
  { field: "set", example: "set:cmd", description: "Código da expansão" },
  { field: "color", example: "color:U", description: "Cor (WUBRG)" },
  { field: "cmc", example: "cmc<=3", description: "Custo de mana convertido" },
  { field: "type", example: "type:Creature", description: "Tipo de card" },
  { field: "rarity", example: "rarity:Mythic", description: "Raridade" },
  { field: "foil", example: "foil:true", description: "Foil" },
  { field: "graded", example: "graded:true", description: "Graduada" },
] as const;

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: (value: string) => void;
  placeholder?: string;
  className?: string;
  "data-testid"?: string;
};

export function SearchBarWithSyntax({
  value,
  onChange,
  onSubmit,
  placeholder,
  className,
  "data-testid": testId,
}: Props) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const parsed = useSearchSyntax(value);

  const getCurrentField = useCallback(() => {
    const beforeCursor = value.slice(0, cursorPosition);
    const match = beforeCursor.match(/([a-zA-Z_]+)$/);
    return match ? match[1].toLowerCase() : null;
  }, [value, cursorPosition]);

  const currentField = getCurrentField();
  const filteredSuggestions = currentField
    ? SYNTAX_SUGGESTIONS.filter((s) => s.field.startsWith(currentField))
    : [];

  function insertSuggestion(suggestion: (typeof SYNTAX_SUGGESTIONS)[number]) {
    const beforeCursor = value.slice(0, cursorPosition);
    const afterCursor = value.slice(cursorPosition);
    const newBefore = beforeCursor.replace(/[a-zA-Z_]+$/, suggestion.example);
    const newValue = `${newBefore} ${afterCursor}`.trim();
    onChange(newValue);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    setTimeout(() => {
      if (inputRef.current) {
        const newPos = newBefore.length + 1;
        inputRef.current.setSelectionRange(newPos, newPos);
        inputRef.current.focus();
      }
    }, 0);
  }

  function removeFilter(index: number) {
    const filter = parsed.filters[index];
    if (!filter) return;
    const pattern = new RegExp(
      `${filter.field}\\s*${filter.operator.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*("[^"]+"|\\S+)`,
      "g",
    );
    onChange(value.replace(pattern, "").replace(/\s+/g, " ").trim());
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      if (highlightedIndex >= 0 && filteredSuggestions[highlightedIndex]) {
        insertSuggestion(filteredSuggestions[highlightedIndex]);
      } else {
        onSubmit?.(value);
        setShowSuggestions(false);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, filteredSuggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Tab" && highlightedIndex >= 0) {
      e.preventDefault();
      insertSuggestion(filteredSuggestions[highlightedIndex]);
    }
  }

  if (process.env.NEXT_PUBLIC_FEATURE_SYNTAX_SEARCH === "false") {
    return (
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
        data-testid={testId}
      />
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setCursorPosition(e.target.selectionStart || 0);
            setShowSuggestions(true);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={placeholder || "Buscar cards…"}
          className={className ?? "h-11 w-full rounded-md border border-white/10 bg-white/5 py-2.5 pl-10 pr-20 text-sm"}
          data-testid={testId}
        />
        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {parsed.filters.length > 0 && (
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
              {parsed.filters.length} filtro{parsed.filters.length > 1 ? "s" : ""}
            </span>
          )}
          {parsed.errors.length > 0 && (
            <span
              className="rounded bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive"
              title={parsed.errors.join(", ")}
            >
              {parsed.errors.length} erro{parsed.errors.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border bg-popover py-1 shadow-lg">
          <p className="px-3 py-1.5 text-xs uppercase text-muted-foreground">Campos de busca</p>
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={suggestion.field}
              type="button"
              className={`flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted ${
                index === highlightedIndex ? "bg-muted" : ""
              }`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insertSuggestion(suggestion)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                {suggestion.field}
              </code>
              <span className="text-sm">{suggestion.description}</span>
              <span className="ml-auto text-xs text-muted-foreground">{suggestion.example}</span>
            </button>
          ))}
        </div>
      )}

      {value && parsed.filters.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {parsed.filters.map((filter, i) => (
            <span
              key={`${filter.field}-${i}`}
              className="inline-flex items-center gap-1 rounded-full bg-primary/5 px-2 py-1 text-xs text-primary"
            >
              <span className="font-medium">{filter.field}</span>
              <span className="text-muted-foreground">{filter.operator}</span>
              <span>{String(filter.value)}</span>
              <button type="button" onClick={() => removeFilter(i)} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
