"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { UpgradeModal } from "@/components/premium/UpgradeModal";
import type { PlanFeature } from "@/lib/plan-limits/constants";

type UpgradeState = {
  open: boolean;
  feature: PlanFeature;
};

type UpgradeContextValue = {
  showUpgrade: (feature: PlanFeature) => void;
  hideUpgrade: () => void;
};

const UpgradeModalContext = createContext<UpgradeContextValue | null>(null);

export function UpgradeModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UpgradeState>({ open: false, feature: "consultas" });

  const showUpgrade = useCallback((feature: PlanFeature) => {
    setState({ open: true, feature });
  }, []);

  const hideUpgrade = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  const value = useMemo(() => ({ showUpgrade, hideUpgrade }), [showUpgrade, hideUpgrade]);

  return (
    <UpgradeModalContext.Provider value={value}>
      {children}
      <UpgradeModal open={state.open} feature={state.feature} onClose={hideUpgrade} />
    </UpgradeModalContext.Provider>
  );
}

export function useUpgradeModal() {
  const ctx = useContext(UpgradeModalContext);
  if (!ctx) {
    throw new Error("useUpgradeModal must be used within UpgradeModalProvider");
  }
  return ctx;
}
