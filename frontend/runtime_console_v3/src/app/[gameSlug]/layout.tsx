import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { isKnownGameSlug } from "@/lib/game-routes";

type Props = {
  children: ReactNode;
  params: Promise<{ gameSlug: string }>;
};

export default async function GameSlugLayout({ children, params }: Props) {
  const { gameSlug } = await params;
  if (!isKnownGameSlug(gameSlug)) notFound();
  return children;
}
