import type { Metadata } from "next";
import { EditorialHubClient } from "@/components/editorial/EditorialHubClient";
import { withCanonical } from "@/lib/page-metadata";

export const metadata: Metadata = withCanonical("/editorial", {
  title: "Editorial — notícias, guias e meta",
  description: "Conteúdo TCG com links contextuais para cartas, decks, expansões e marketplace.",
});

export default function EditorialPage() {
  return <EditorialHubClient />;
}
