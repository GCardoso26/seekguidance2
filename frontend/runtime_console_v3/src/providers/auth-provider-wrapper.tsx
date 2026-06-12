"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/features/auth/AuthProvider";

export function AuthProviderWrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
