import { Badge } from "@/components/ui/badge";
import type { Deck } from "@/types/deck";

interface DeckStatusBadgeProps {
  deck: Pick<Deck, "is_validated" | "is_public">;
}

export function DeckStatusBadge({ deck }: DeckStatusBadgeProps) {
  if (deck.is_validated === true) {
    return <Badge variant="success">Válido</Badge>;
  }
  if (deck.is_validated === false) {
    return <Badge variant="warning">Rascunho</Badge>;
  }
  return <Badge variant="default">Não validado</Badge>;
}
