import { cn } from "@/lib/utils";
export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("flex h-9 w-full rounded-md border border-border bg-card px-3 text-sm", className)} {...props} />;
}
