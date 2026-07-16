import type { HTMLAttributes, ReactNode } from "react";

export function Card({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-lg border border-zinc-200 bg-white p-6 shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
