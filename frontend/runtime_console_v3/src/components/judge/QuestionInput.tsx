"use client";

import { useRef } from "react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  placeholder?: string;
};

export function QuestionInput({ value, onChange, onSubmit, disabled, placeholder }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSubmit();
    }
  }

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      disabled={disabled}
      rows={4}
      placeholder={placeholder ?? "Ex.: O que acontece na fase de manutenção no Magic?"}
      className={cn(
        "w-full resize-none rounded-2xl border border-[hsl(var(--border))] bg-white px-4 py-3.5 text-sm shadow-sm",
        "placeholder:text-[hsl(222_15%_55%)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]/35",
        "min-h-[128px] max-h-[280px]",
      )}
    />
  );
}
