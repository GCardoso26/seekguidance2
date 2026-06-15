import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function MetallicGradient({ className }: Props) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 bg-[length:200%_200%] animate-gradient-shift opacity-40",
        "bg-gradient-to-br from-luxury-gold/20 via-luxury-silver/10 to-luxury-gold-dark/20",
        className,
      )}
    />
  );
}
