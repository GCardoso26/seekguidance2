import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const styles: Record<Variant, string> = {
  primary:
    "bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50",
  secondary:
    "bg-zinc-200 text-zinc-900 hover:bg-zinc-300 disabled:opacity-50",
  ghost: "bg-transparent text-zinc-800 hover:bg-zinc-100 disabled:opacity-50",
};

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: Variant;
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
