import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  apiKey: string | null;
  tenantId: string;
  username: string | null;
  remember: boolean;
  setSession: (data: {
    accessToken: string;
    refreshToken: string;
    username?: string;
    tenantId?: string;
  }) => void;
  setApiKey: (key: string | null) => void;
  setTenantId: (tenantId: string) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      apiKey: null,
      tenantId: "default",
      username: null,
      remember: true,
      setSession: ({ accessToken, refreshToken, username, tenantId }) =>
        set({
          accessToken,
          refreshToken,
          username: username ?? null,
          tenantId: tenantId ?? "default",
        }),
      setApiKey: (apiKey) => set({ apiKey, accessToken: null }),
      setTenantId: (tenantId) => set({ tenantId }),
      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          apiKey: null,
          username: null,
        }),
    }),
    { name: "runtime-console-auth" },
  ),
);
