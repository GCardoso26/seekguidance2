import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const surfaceVariants = cva("rounded-xl border transition-all duration-200", {
  variants: {
    variant: {
      default: "border-border bg-card shadow-card",
      muted: "border-border bg-muted/40",
      elevated: "border-border bg-card shadow-md",
      interactive:
        "border-border bg-card shadow-card hover:border-primary/20 hover:shadow-card-hover",
      inset: "border-border/60 bg-muted/30",
    },
    padding: {
      none: "",
      sm: "p-4",
      md: "p-5",
      lg: "p-6",
    },
  },
  defaultVariants: {
    variant: "default",
    padding: "md",
  },
});

export interface SurfaceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof surfaceVariants> {}

/** Superfície padronizada — substitui `border-border bg-muted/50` ad hoc. */
export function Surface({ className, variant, padding, ...props }: SurfaceProps) {
  return <div className={cn(surfaceVariants({ variant, padding }), className)} {...props} />;
}

export { surfaceVariants };
