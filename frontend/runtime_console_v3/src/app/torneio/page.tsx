import { redirect } from "next/navigation";

/** /torneio → /search/torneios (superfície canônica de Eventos). */
export default function TorneioIndexRedirect() {
  redirect("/search/torneios");
}
