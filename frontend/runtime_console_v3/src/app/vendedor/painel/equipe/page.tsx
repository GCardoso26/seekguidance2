import { redirect } from "next/navigation";

/** Índice sem page — default do nav é Usuários. */
export default function SellerEquipeIndexRedirect() {
  redirect("/vendedor/painel/equipe/usuarios");
}
