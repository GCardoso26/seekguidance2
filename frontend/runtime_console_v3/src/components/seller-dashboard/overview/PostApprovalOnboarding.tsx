"use client";

import Link from "next/link";

type Step = {
  id: string;
  label: string;
  done: boolean;
  href: string;
};

export function PostApprovalOnboarding({
  visible,
  steps,
}: {
  visible?: boolean;
  steps?: Step[];
}) {
  if (!visible || !steps?.length) return null;
  const pending = steps.filter((s) => !s.done);
  if (!pending.length) return null;

  return (
    <section className="mx-4 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:mx-0">
      <h2 className="text-sm font-semibold tracking-tight">Sua loja foi aprovada — próximos passos</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Sem cadastro manual de produto no onboarding: importe CSV com match no Master Catalog ou use o
        catálogo.
      </p>
      <ol className="mt-3 space-y-2">
        {steps.map((step) => (
          <li key={step.id} className="flex items-center justify-between gap-3 text-sm">
            <span className={step.done ? "text-muted-foreground line-through" : "text-foreground"}>
              {step.done ? "✓ " : "○ "}
              {step.label}
            </span>
            {!step.done && (
              <Link href={step.href} className="shrink-0 text-xs text-primary underline">
                Abrir
              </Link>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
