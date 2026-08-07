import { NewDeckForm } from "@/components/decks/NewDeckForm";

/** Evita HTML pré-renderizado apontando para chunk estático ausente (MIME text/plain + nosniff). */
export const dynamic = "force-dynamic";

export default function NovoDeckPage() {
  return <NewDeckForm />;
}
