import type { ReactNode } from "react";
import { PageEmpty } from "@/components/ui/async-state";

type Props = {
  title: string;
  description?: string;
  action?: ReactNode;
};

/** Empty state do painel — delega ao PageEmpty canônico (RC11). */
export function EmptyState({ title, description, action }: Props) {
  return <PageEmpty variant="panel" title={title} description={description} footer={action} />;
}
