"use client";

import type { ReactNode } from "react";
import { CartDrawerOnDemand } from "@/components/cart/CartDrawerOnDemand";

/** Compat: monta CartDrawer apenas após primeira abertura. */
export function CartProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <CartDrawerOnDemand />
    </>
  );
}
