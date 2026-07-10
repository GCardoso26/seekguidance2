import Link from "next/link";
import { Check, CreditCard, ShoppingBag, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type CheckoutStep = "cart" | "payment" | "confirmation";

const STEPS: Array<{
  id: CheckoutStep;
  label: string;
  shortLabel: string;
  href?: string;
  icon: typeof ShoppingBag;
}> = [
  { id: "cart", label: "Carrinho", shortLabel: "Carrinho", href: "/carrinho", icon: ShoppingBag },
  { id: "payment", label: "Pagamento", shortLabel: "Pagar", icon: CreditCard },
  { id: "confirmation", label: "Confirmação", shortLabel: "Pronto", icon: Sparkles },
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
    <nav aria-label="Progresso do checkout" data-testid="checkout-progress" className={cn(className)}>
      <ol className="flex items-center">
        {STEPS.map((step, index) => {
          const isComplete = index < currentIdx;
          const isCurrent = index === currentIdx;
          const isUpcoming = index > currentIdx;
          const Icon = step.icon;

          return (
            <li key={step.id} className="flex flex-1 items-center last:flex-none">
              <div className="flex min-w-0 items-center gap-2.5">
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                    isComplete && "bg-primary text-primary-foreground shadow-sm",
                    isCurrent && "border-2 border-primary bg-primary/10 text-primary shadow-sm",
                    isUpcoming && "border border-border bg-muted text-muted-foreground",
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isComplete ? <Check className="h-4 w-4" aria-hidden /> : <Icon className="h-4 w-4" aria-hidden />}
                </span>
                <div className="min-w-0">
                  {step.href && (isComplete || isCurrent) ? (
                    <Link
                      href={step.href}
                      className={cn(
                        "block truncate text-caption font-medium hover:text-primary sm:text-small",
                        isCurrent ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      <span className="sm:hidden">{step.shortLabel}</span>
                      <span className="hidden sm:inline">{step.label}</span>
                    </Link>
                  ) : (
                    <span
                      className={cn(
                        "block truncate text-caption font-medium sm:text-small",
                        isCurrent ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      <span className="sm:hidden">{step.shortLabel}</span>
                      <span className="hidden sm:inline">{step.label}</span>
                    </span>
                  )}
                  {isCurrent && (
                    <span className="hidden text-hint text-primary sm:block">Etapa atual</span>
                  )}
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-0.5 flex-1 rounded-full sm:mx-4",
                    index < currentIdx ? "bg-primary" : "bg-border",
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
