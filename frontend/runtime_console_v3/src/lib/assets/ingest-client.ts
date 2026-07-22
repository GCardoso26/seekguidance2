/** Cliente FE → BFF → Asset Pipeline (ingest / unlink). */

export type AssetIngestInput = {
  sourceUrl: string;
  entityType: string;
  entityId: string;
  role?: string;
  sortOrder?: number;
  mediaType?: string;
  alt?: string;
  requestId?: string;
};

export type AssetIngestResult = {
  ok: boolean;
  reused: boolean;
  link_created: boolean;
  asset: {
    id: string;
    sha256: string;
    cdn_url: string | null;
    thumbnail_url?: string | null;
    derivatives?: Record<string, unknown>;
  };
};

export async function ingestProductAsset(input: AssetIngestInput): Promise<AssetIngestResult> {
  const res = await fetch("/api/assets/ingest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source_url: input.sourceUrl,
      entity_type: input.entityType,
      entity_id: input.entityId,
      role: input.role ?? "front",
      sort_order: input.sortOrder ?? 0,
      media_type: input.mediaType,
      alt: input.alt,
      request_id: input.requestId,
      provider_id: "seller_upload",
    }),
  });
  const data = (await res.json().catch(() => ({}))) as AssetIngestResult & { detail?: string };
  if (!res.ok) {
    throw new Error(typeof data.detail === "string" ? data.detail : "Falha no ingest de asset");
  }
  return data;
}

export async function unlinkProductAsset(input: {
  entityType: string;
  entityId: string;
  role?: string;
  assetId?: string;
}): Promise<{ ok: boolean; unlinked: number }> {
  const res = await fetch("/api/assets/links", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      entity_type: input.entityType,
      entity_id: input.entityId,
      role: input.role,
      asset_id: input.assetId,
    }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    unlinked?: number;
    detail?: string;
  };
  if (!res.ok) {
    throw new Error(typeof data.detail === "string" ? data.detail : "Falha ao remover link");
  }
  return { ok: Boolean(data.ok), unlinked: Number(data.unlinked ?? 0) };
}
