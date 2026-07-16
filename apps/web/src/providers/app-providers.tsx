"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { AuthProvider } from "@/src/auth/auth-provider";
import { CartProvider } from "@/src/cart/cart-provider";

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>{children}</CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
