"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import dynamic from "next/dynamic";
import type { PlanFeature } from "@/lib/plan-limits/constants";

const UpgradeModal = dynamic(
  () => import("@/components/premium/UpgradeModal").then((m) => m.UpgradeModal),
  { ssr: false },
);

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
      {state.open ? (
        <UpgradeModal open={state.open} feature={state.feature} onClose={hideUpgrade} />
      ) : null}
    </UpgradeModalContext.Provider>
  );
}

export function useUpgradeModal() {
  const ctx = useContext(UpgradeModalContext);
  if (!ctx) {
    return {
      showUpgrade: (_feature: PlanFeature) => {},
      hideUpgrade: () => {},
    };
  }
  return ctx;
}
