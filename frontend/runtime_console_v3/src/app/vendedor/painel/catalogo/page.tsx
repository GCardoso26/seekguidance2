import { redirect } from "next/navigation";

/** Índice sem page — default do nav é Cartas. */
export default function SellerCatalogoIndexRedirect() {
  redirect("/vendedor/painel/catalogo/cartas");
}
