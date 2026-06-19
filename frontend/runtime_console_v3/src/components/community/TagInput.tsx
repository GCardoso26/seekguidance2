"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";

type Props = {
  tags: string[];
  onChange: (tags: string[]) => void;
  max?: number;
};

export function TagInput({ tags, onChange, max = 5 }: Props) {
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (input.length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      void fetch(`/api/social/tags?q=${encodeURIComponent(input)}`)
        .then((r) => r.json())
        .then((data: string[]) => setSuggestions(Array.isArray(data) ? data : []))
        .catch(() => setSuggestions([]));
    }, 200);
    return () => clearTimeout(t);
  }, [input]);

  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, "-");
    if (!tag || tags.includes(tag) || tags.length >= max) return;
    onChange([...tags, tag]);
    setInput("");
    setSuggestions([]);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-luxury-gold/15 px-2 py-0.5 text-xs text-luxury-gold-light"
          >
            #{tag}
            <button type="button" aria-label={`Remover ${tag}`} onClick={() => onChange(tags.filter((t) => t !== tag))}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="relative">
        <Input
          placeholder="Tags (Enter para adicionar)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag(input);
            }
          }}
          className="border-white/10 bg-white/5"
        />
        {suggestions.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full rounded-lg border border-white/10 bg-luxury-obsidian py-1 shadow-lg">
            {suggestions
              .filter((s) => !tags.includes(s))
              .slice(0, 6)
              .map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    className="block w-full px-3 py-1.5 text-left text-sm hover:bg-white/5"
                    onClick={() => addTag(s)}
                  >
                    #{s}
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
