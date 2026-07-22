"use client";

import Link from "next/link";
import type { ActivityItem } from "@/lib/profile-activity";
import { Skeleton } from "@/components/ui/skeleton";

type Props = {
  items: ActivityItem[];
  loading?: boolean;
  enabled?: boolean;
};

export function ProfileActivityFeed({ items, loading, enabled = true }: Props) {
  if (!enabled) {
    return (
      <p className="text-small text-muted-foreground" data-testid="profile-activity-disabled">
        Activity Feed desativado (PLAYER_ACTIVITY).
      </p>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3" data-testid="profile-activity-skeleton">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        className="rounded-xl border border-dashed border-border p-8 text-center"
        data-testid="profile-activity-empty"
      >
        <p className="text-sm text-muted-foreground">
          Seu histórico de jornada aparecerá aqui conforme você compra, monta decks e atualiza a
          coleção.
        </p>
      </div>
    );
  }

  return (
    <ol className="relative space-y-0 border-l border-border pl-5" data-testid="profile-activity-feed">
      {items.map((item) => (
        <li key={item.id} className="relative pb-6 last:pb-0">
          <span
            className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full bg-primary/80 ring-4 ring-background"
            aria-hidden
          />
          <p className="text-sm font-medium text-foreground">
            {item.href ? (
              <Link href={item.href} className="hover:text-primary hover:underline">
                {item.title}
              </Link>
            ) : (
              item.title
            )}
          </p>
          {item.description ? (
            <p className="mt-0.5 text-caption text-muted-foreground">{item.description}</p>
          ) : null}
          <time
            className="mt-1 block text-caption text-muted-foreground"
            dateTime={item.occurredAt}
          >
            {new Date(item.occurredAt).toLocaleString("pt-BR")}
          </time>
        </li>
      ))}
    </ol>
  );
}
