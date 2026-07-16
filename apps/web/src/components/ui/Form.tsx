import type { FormHTMLAttributes, ReactNode } from "react";

export function Form({
  children,
  className = "",
  ...props
}: FormHTMLAttributes<HTMLFormElement> & { children: ReactNode }) {
  return (
    <form className={`flex flex-col gap-4 ${className}`} {...props}>
      {children}
    </form>
  );
}

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm text-zinc-800">
      <span className="font-medium">{label}</span>
      {children}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  );
}
