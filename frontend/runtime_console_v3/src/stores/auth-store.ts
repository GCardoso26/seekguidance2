import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthState = {
  isAuthenticated: boolean;
  username: string | null;
  tenantId: string;
  setAuthenticated: (data: { username?: string; tenantId?: string }) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      username: null,
      tenantId: "default",
      setAuthenticated: ({ username, tenantId }) =>
        set({
          isAuthenticated: true,
          username: username ?? null,
          tenantId: tenantId ?? "default",
        }),
      logout: () =>
        set({
          isAuthenticated: false,
          username: null,
          tenantId: "default",
        }),
    }),
    {
      name: "runtime-console-auth",
      partialize: (s) => ({
        isAuthenticated: s.isAuthenticated,
        username: s.username,
        tenantId: s.tenantId,
      }),
    },
  ),
);
