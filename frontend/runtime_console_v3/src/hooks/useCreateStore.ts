"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export type CreateStoreData = {
  name: string;
  slug: string;
  description?: string;
  email: string;
  city?: string;
  country?: string;
};

export function useCreateStore() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (data: CreateStoreData) => {
      const res = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(String(error.detail ?? error.message ?? "Falha ao criar loja"));
      }
      return res.json() as Promise<{ slug: string }>;
    },
    onSuccess: (data) => {
      router.push(`/stores/${data.slug}`);
    },
  });
}
