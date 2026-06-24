import { Inbox, PackageX, SearchX, type LucideIcon } from "lucide-react";
import Link from "next/link";

const icons = {
  search: SearchX,
  product: PackageX,
  generic: Inbox,
} satisfies Record<string, LucideIcon>;

export interface EmptyStateProps {
  type?: keyof typeof icons;
  title: string;
  description: string;
  action?: { label: string; href: string };
}

export function EmptyState({ type = "generic", title, description, action }: EmptyStateProps) {
  const Icon = icons[type];

  return (
    <div className="flex flex-col items-center justify-center px-4 py-20 text-center animate-fade-in" role="status">
      <div className="mb-6 flex h-20 w-20 animate-pulse-slow items-center justify-center rounded-full bg-zinc-800/50">
        <Icon className="h-10 w-10 text-zinc-500" aria-hidden />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-white">{title}</h3>
      <p className="mb-6 max-w-sm text-zinc-400">{description}</p>
      {action && (
        <Link href={action.href} className="font-medium text-purple-400 transition-colors hover:text-purple-300">
          {action.label} →
        </Link>
      )}
    </div>
  );
}
