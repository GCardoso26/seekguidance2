import { redirect } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

/** /torneio/:id → /search/torneios/:id (ops-dashboard permanece em rota irmã). */
export default async function TorneioDetailRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/search/torneios/${encodeURIComponent(id)}`);
}
