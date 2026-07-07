import type { ReactNode } from "react";
import { PageEmpty } from "@/components/ui/async-state";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: { label: string; href: string };
}

/** Empty state para marketplace / catálogo público. */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <PageEmpty
      title={title}
      description={description}
      action={action}
      icon={icon}
      variant="default"
    />
  );
}
