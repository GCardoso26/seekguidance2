"use client";

import Link from "next/link";
import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { entrarPath } from "@/lib/auth/entrar-path";
import type { UnifiedCard } from "@/types/card";
import { useAnalytics } from "@/hooks/useAnalytics";

type Props = {
  card: UnifiedCard;
};

export function AnnounceCardCta({ card }: Props) {
  const { user } = useJudgeAuth();
  const { track } = useAnalytics();
  const href = `/vendedor/painel/listagens/nova?cardId=${encodeURIComponent(card.id)}`;

  if (!user) {
    return (
      <Button variant="outline" size="sm" asChild>
        <Link href={entrarPath(href)}>
          <Megaphone className="mr-1 h-4 w-4" />
          Anunciar esta carta
        </Link>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      asChild
      onClick={() => track("announce_card_click", { card_id: card.id })}
    >
      <Link href={href} data-testid="announce-card-cta">
        <Megaphone className="mr-1 h-4 w-4" />
        Anunciar esta carta
      </Link>
    </Button>
  );
}
