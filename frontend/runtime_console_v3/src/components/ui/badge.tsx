import { cn } from "@/lib/utils";

export function Badge({ className, variant = "default", ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "success" | "warning" | "danger" }) {
  const v = { default: "bg-primary/20 text-primary", success: "bg-success/20 text-success", warning: "bg-warning/20 text-warning", danger: "bg-danger/20 text-danger" };
  return <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", v[variant], className)} {...props} />;
}
