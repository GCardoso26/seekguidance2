import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function Separator({ className }: Props) {
  return <div className={cn("h-px w-full bg-white/10", className)} aria-hidden />;
}
