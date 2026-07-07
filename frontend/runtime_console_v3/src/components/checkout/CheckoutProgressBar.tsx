import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type CheckoutStep = "cart" | "payment" | "confirmation";

const STEPS: Array<{
  id: CheckoutStep;
  label: string;
  href?: string;
}> = [
  { id: "cart", label: "Carrinho", href: "/carrinho" },
  { id: "payment", label: "Pagamento" },
  { id: "confirmation", label: "Confirmação" },
];

type Props = {
  currentStep: CheckoutStep;
  className?: string;
};

function stepIndex(step: CheckoutStep): number {
  return STEPS.findIndex((s) => s.id === step);
}

export function CheckoutProgressBar({ currentStep, className }: Props) {
  const currentIdx = stepIndex(currentStep);

  return (
    <nav
      aria-label="Progresso do checkout"
      data-testid="checkout-progress"
      className={cn("mt-6", className)}
    >
      <ol className="flex items-center gap-2 sm:gap-4">
        {STEPS.map((step, index) => {
          const isComplete = index < currentIdx;
          const isCurrent = index === currentIdx;
          const isUpcoming = index > currentIdx;

          return (
            <li key={step.id} className="flex min-w-0 flex-1 items-center gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                    isComplete && "bg-luxury-gold text-luxury-onyx",
                    isCurrent && "border-2 border-luxury-gold bg-luxury-gold/10 text-luxury-gold",
                    isUpcoming && "border border-white/20 bg-white/5 text-luxury-mist",
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isComplete ? <Check className="h-4 w-4" aria-hidden /> : index + 1}
                </span>
                {step.href && (isComplete || isCurrent) ? (
                  <Link
                    href={step.href}
                    className={cn(
                      "truncate text-sm font-medium hover:text-luxury-frost",
                      isCurrent ? "text-luxury-frost" : "text-luxury-mist",
                    )}
                  >
                    {step.label}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      "truncate text-sm font-medium",
                      isCurrent ? "text-luxury-frost" : "text-luxury-mist/70",
                    )}
                  >
                    {step.label}
                  </span>
                )}
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "hidden h-px flex-1 sm:block",
                    index < currentIdx ? "bg-luxury-gold/60" : "bg-white/15",
                  )}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
