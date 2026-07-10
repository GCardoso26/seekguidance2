import type { HTMLAttributes, ReactNode } from "react";
import { Card as BaseCard, type CardProps } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Props = CardProps & {
  children: ReactNode;
  /** @deprecated Use variant="interactive" */
  hover?: boolean;
};

/** @deprecated Use `@/components/ui/card` */
export function Card({ children, className, hover = false, variant, ...props }: Props) {
  return (
    <BaseCard
      variant={variant ?? (hover ? "interactive" : "default")}
      padding="lg"
      className={cn(className)}
      {...props}
    >
      {children}
    </BaseCard>
  );
}

export {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  cardVariants,
} from "@/components/ui/card";
export type { CardProps } from "@/components/ui/card";
