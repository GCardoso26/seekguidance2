import Link from "next/link";
import { notFound } from "next/navigation";
import { Scale } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";

const GAME_RULES: Record<string, { title: string; description: string }> = {
  mtg: {
    title: "Magic: The Gathering",
    description: "Regras abrangentes, pilha, prioridade e interações de camadas.",
  },
  pokemon: {
    title: "Pokémon TCG",
    description: "Turnos, evolução, condições especiais e efeitos entre turnos.",
  },
  yugioh: {
    title: "Yu-Gi-Oh!",
    description: "Invocações, cadeia de efeitos e zonas do campo.",
  },
  lorcana: {
    title: "Disney Lorcana",
    description: "Ink, lore, desafios e personagens.",
  },
  onepiece: {
    title: "One Piece Card Game",
    description: "Líder, DON!! e batalhas entre personagens.",
  },
  fab: {
    title: "Flesh and Blood",
    description: "Ações, reações, go again e combate.",
  },
  digimon: {
    title: "Digimon Card Game",
    description: "Digivolução, memória e segurança.",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = GAME_RULES[slug.toLowerCase()];
  if (!game) return { title: "Regras — Judge TCG" };
  return {
    title: `Regras ${game.title} — Judge TCG`,
    description: game.description,
  };
}

export default async function RegrasGamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = GAME_RULES[slug.toLowerCase()];
  if (!game) notFound();

  return (
    <MobileLayout>
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Link href="/regras" className="text-sm text-muted-foreground">
          ← Regras
        </Link>
        <div className="mt-4 flex items-center gap-3">
          <Scale className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">{game.title}</h1>
        </div>
        <p className="mt-4 text-muted-foreground">{game.description}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href={`/judge?game=${slug}`}>Consultar assistente de juiz</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/${slug}/cards`}>Buscar cartas</Link>
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
}
