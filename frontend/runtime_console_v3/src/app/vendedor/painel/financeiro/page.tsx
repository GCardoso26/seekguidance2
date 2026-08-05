import { redirect } from "next/navigation";

/** Índice sem page — default do nav é Receitas. */
export default function SellerFinanceiroIndexRedirect() {
  redirect("/vendedor/painel/financeiro/receitas");
}
