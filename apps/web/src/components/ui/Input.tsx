import type { InputHTMLAttributes } from "react";

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 ${className}`}
      {...props}
    />
  );
}
