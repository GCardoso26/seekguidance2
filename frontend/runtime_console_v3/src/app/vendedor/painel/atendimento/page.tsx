import { redirect } from "next/navigation";

/** Índice sem page — default do nav é Tickets. */
export default function SellerAtendimentoIndexRedirect() {
  redirect("/vendedor/painel/atendimento/tickets");
}
