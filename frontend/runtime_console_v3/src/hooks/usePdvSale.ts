"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { awardXpFireAndForget } from "@/lib/award-xp-client";
import { buildPdvSaleFormValues, parsePdvSaleForm, pdvSaleToApiPayload } from "@/lib/pdv-sale-form";
import type { PdvCartItem, PdvPaymentMethod, PdvSaleRecord } from "@/types/pdv";

type SaleInput = {
  storeId: string;
  items: PdvCartItem[];
  paymentMethod: PdvPaymentMethod;
  notes?: string;
};

async function postPdvSale({ storeId, items, paymentMethod, notes }: SaleInput): Promise<PdvSaleRecord> {
  const formValues = buildPdvSaleFormValues(items, paymentMethod, notes);
  const parsed = parsePdvSaleForm(formValues);
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Dados inválidos");
  }

  const res = await fetch(`/api/marketplace/shop/stores/${encodeURIComponent(storeId)}/pdv`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pdvSaleToApiPayload(items, paymentMethod, notes)),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(String(err.detail ?? "Erro na venda"));
  }

  const data = (await res.json()) as { sale?: PdvSaleRecord };
  return data.sale ?? {};
}

export function usePdvSale(storeId: string | null) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: Omit<SaleInput, "storeId"> & { storeId?: string }) => {
      const sid = input.storeId ?? storeId;
      if (!sid) throw new Error("Loja não encontrada");
      return postPdvSale({ ...input, storeId: sid });
    },
    onSuccess: (_sale, variables) => {
      const sid = variables.storeId ?? storeId;
      if (sid) {
        void qc.invalidateQueries({ queryKey: ["pdv-search", sid] });
        void qc.invalidateQueries({ queryKey: ["seller-inventory"] });
      }
      awardXpFireAndForget("seller_sale", qc);
    },
  });
}
