import { redirect } from "next/navigation";

/** Legacy Collection V1 → Collection V2 hub */
export default function PerfilColecaoRedirect() {
  redirect("/colecao");
}
