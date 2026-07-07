import type { SellerListingRow } from "@/types/seller-listing";

export type BulkPatchResult = {
  ok: string[];
  failed: string[];
};

/** Aplica PATCH em paralelo por ID — sem novo endpoint (contrato existente). */
export async function bulkPatchListings(
  ids: string[],
  body: Record<string, unknown>,
): Promise<BulkPatchResult> {
  const ok: string[] = [];
  const failed: string[] = [];

  await Promise.all(
    ids.map(async (id) => {
      const res = await fetch(`/api/seller/listings/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) ok.push(id);
      else failed.push(id);
    }),
  );

  return { ok, failed };
}

/** Duplica anúncio via POST com payload da listagem existente. */
export async function duplicateListing(row: SellerListingRow): Promise<{ id: string } | null> {
  const res = await fetch("/api/seller/listings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      card_id: row.cardId,
      condition: row.condition,
      price: row.price,
      quantity: row.quantity,
      foil: row.foil,
      language: row.language,
      description: row.description ?? "",
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { id?: string; listing_id?: string };
  const id = data.id ?? data.listing_id;
  return id ? { id } : null;
}

export async function bulkDuplicateListings(
  rows: SellerListingRow[],
): Promise<{ ok: string[]; failed: string[] }> {
  const ok: string[] = [];
  const failed: string[] = [];

  for (const row of rows) {
    const result = await duplicateListing(row);
    if (result) ok.push(result.id);
    else failed.push(row.id);
  }

  return { ok, failed };
}

/** Arquivar = status inactive (WF-002 — sem estado archived no contrato atual). */
export function archiveListingPatch() {
  return { status: "inactive" as const };
}

export function exportListingsCsv(rows: SellerListingRow[]): string {
  const headers = [
    "id",
    "cardName",
    "setName",
    "language",
    "foil",
    "condition",
    "price",
    "quantity",
    "status",
    "createdAt",
  ];
  const lines = rows.map((r) =>
    [
      r.id,
      r.cardName ?? "",
      r.setName ?? "",
      r.language,
      r.foil ? "yes" : "no",
      r.condition,
      r.price,
      r.quantity,
      r.status ?? "active",
      r.createdAt ?? "",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  return [headers.join(","), ...lines].join("\n");
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
