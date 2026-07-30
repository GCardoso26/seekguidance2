import { redirect } from "next/navigation";

/** Link legado — performance vive em estatísticas. */
export default function SellerPerformanceRedirect() {
  redirect("/vendedor/painel/estatisticas");
}
