"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/** Compat: /pedidos/[orderId] → drawer na lista. */
export default function PedidoRedirectPage() {
  const params = useParams<{ orderId: string }>();
  const router = useRouter();

  useEffect(() => {
    if (params.orderId) {
      router.replace(`/vendedor/painel/pedidos?drawer=${encodeURIComponent(params.orderId)}`);
    }
  }, [params.orderId, router]);

  return <p className="p-6 text-muted-foreground">Redirecionando…</p>;
}
