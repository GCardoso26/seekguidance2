import { redirect } from "next/navigation";

/** Legado: canônico em /loja/selados (next.config também 301). */
export default function MarketplaceProdutosRedirectPage() {
  redirect("/loja/selados");
}
