import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  action?: ReactNode;
};

/** Empty state compacto para painel vendedor. */
export function EmptyState({ title, description, action }: Props) {
  return (
    <div
      className="rounded-xl border border-dashed border-white/15 bg-muted/50 p-10 text-center"
      data-testid="page-empty"
    >
      <p className="font-medium text-white">{title}</p>
      {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
