"use client";

import { createContext, useContext, type ReactNode } from "react";

type SellerPanelContextValue = {
  plan: string;
};

const SellerPanelContext = createContext<SellerPanelContextValue>({ plan: "free" });

export function SellerPanelProvider({
  plan,
  children,
}: {
  plan: string;
  children: ReactNode;
}) {
  return (
    <SellerPanelContext.Provider value={{ plan }}>{children}</SellerPanelContext.Provider>
  );
}

export function useSellerPanel() {
  return useContext(SellerPanelContext);
}
