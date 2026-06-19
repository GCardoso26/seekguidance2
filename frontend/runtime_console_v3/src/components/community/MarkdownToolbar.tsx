"use client";

import { Bold, Italic, Link, List } from "lucide-react";
import { wrapSelection } from "@/lib/markdown";

type Props = {
  value: string;
  onChange: (value: string) => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
};

export function MarkdownToolbar({ value, onChange, textareaRef }: Props) {
  const apply = (before: string, after: string) => {
    const el = textareaRef?.current;
    if (!el) return;
    const { next, cursor } = wrapSelection(value, el.selectionStart, el.selectionEnd, before, after);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursor, cursor);
    });
  };

  const buttons = [
    { icon: Bold, label: "Negrito", action: () => apply("**", "**") },
    { icon: Italic, label: "Itálico", action: () => apply("*", "*") },
    { icon: Link, label: "Link", action: () => apply("[texto](", ")") },
    { icon: List, label: "Lista", action: () => apply("- ", "") },
  ];

  return (
    <div className="flex gap-1 rounded-t-lg border border-b-0 border-white/10 bg-white/5 p-1">
      {buttons.map(({ icon: Icon, label, action }) => (
        <button
          key={label}
          type="button"
          aria-label={label}
          onClick={action}
          className="rounded p-1.5 text-luxury-mist hover:bg-white/10 hover:text-luxury-frost"
        >
          <Icon className="h-4 w-4" strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );
}
