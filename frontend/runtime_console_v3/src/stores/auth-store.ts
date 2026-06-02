import { create } from "zustand";

import { persist } from "zustand/middleware";



type AuthState = {
  isAuthenticated: boolean;
  username: string | null;
  tenantId: string;
  role: string | null;
  setAuthenticated: (data: { username?: string; tenantId?: string; role?: string }) => void;
  logout: () => void;
};



export const useAuthStore = create<AuthState>()(

  persist(

    (set) => ({

      isAuthenticated: false,
      username: null,
      tenantId: "default",
      role: null,
      setAuthenticated: ({ username, tenantId, role }) =>
        set({
          isAuthenticated: true,
          username: username ?? null,
          tenantId: tenantId ?? "default",
          role: role ?? null,
        }),
      logout: () =>
        set({
          isAuthenticated: false,
          username: null,
          tenantId: "default",
          role: null,
        }),

    }),

    {

      name: "runtime-console-auth",

      partialize: (s) => ({
        isAuthenticated: s.isAuthenticated,
        username: s.username,
        tenantId: s.tenantId,
        role: s.role,
      }),

    },

  ),

);


