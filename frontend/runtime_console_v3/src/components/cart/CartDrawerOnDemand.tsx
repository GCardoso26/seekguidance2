"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useCartStore } from "@/stores/cartStore";

const CartDrawer = dynamic(
  () => import("@/components/cart/CartDrawer").then((m) => m.CartDrawer),
  { ssr: false },
);

/** Carrega o drawer só após a primeira abertura — evita chunk no hydrate. */
export function CartDrawerOnDemand() {
  const isOpen = useCartStore((s) => s.isOpen);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (isOpen) setReady(true);
  }, [isOpen]);
  if (!ready) return null;
  return <CartDrawer />;
}
