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
        const detail = error.detail;
        const message =
          typeof detail === "string"
            ? detail
            : Array.isArray(detail)
              ? detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join("; ") || "Falha ao criar loja"
              : String(error.message ?? "Falha ao criar loja");
        throw new Error(message);
      }
      return res.json() as Promise<{ slug: string }>;
    },
    onSuccess: () => {
      router.push("/vendedor/painel/configuracoes/pagamentos");
    },
  });
}
