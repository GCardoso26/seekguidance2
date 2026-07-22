"use client";

import { useCallback, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { compressImage, uploadImage } from "@/lib/supabase/storage";
import { ingestProductAsset, unlinkProductAsset } from "@/lib/assets/ingest-client";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ["image/jpeg", "image/png", "image/webp"];

type Props = {
  label?: string;
  maxSize?: number;
  acceptedTypes?: string[];
  /** Preview legado (data URL ou CDN). */
  previewUrl?: string;
  /** Quando definido, faz ingest → media.assets + asset_links. */
  entityType?: string;
  entityId?: string;
  role?: string;
  mediaType?: string;
  alt?: string;
  /** Callback com URL pública / CDN após sucesso. */
  onUpload: (url: string, meta?: { assetId?: string; reused?: boolean }) => void;
  onRemove?: () => void;
  className?: string;
};

/**
 * Upload lojista: compress → Storage → Asset Pipeline ingest.
 * Fallback: preview local (data URL) se entity ainda não existir.
 */
export function ImageUpload({
  label = "Imagem",
  maxSize = MAX_BYTES,
  acceptedTypes = ACCEPT,
  previewUrl,
  entityType,
  entityId,
  role = "front",
  mediaType,
  alt,
  onUpload,
  onRemove,
  className,
}: Props) {
  const [preview, setPreview] = useState<string | undefined>(previewUrl);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [assetId, setAssetId] = useState<string | undefined>();

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      if (!acceptedTypes.includes(file.type)) {
        setError("Formato inválido. Use JPG, PNG ou WebP.");
        return;
      }
      if (file.size > maxSize) {
        setError("Arquivo muito grande (máx. 5 MB).");
        return;
      }

      setLoading(true);
      try {
        // Preview imediato
        const localPreview = URL.createObjectURL(file);
        setPreview(localPreview);

        await compressImage(file); // valida compressão cedo

        const supabase = createSupabaseBrowserClient();
        const {
          data: { user },
        } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
        if (!user?.id) {
          throw new Error("Faça login para enviar imagens");
        }

        const publicUrl = await uploadImage(file, user.id);
        setPreview(publicUrl);

        if (entityType && entityId) {
          const result = await ingestProductAsset({
            sourceUrl: publicUrl,
            entityType,
            entityId,
            role,
            mediaType,
            alt,
          });
          setAssetId(result.asset.id);
          onUpload(result.asset.thumbnail_url || result.asset.cdn_url || publicUrl, {
            assetId: result.asset.id,
            reused: result.reused,
          });
        } else {
          onUpload(publicUrl);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha no upload");
        setPreview(previewUrl);
      } finally {
        setLoading(false);
      }
    },
    [
      acceptedTypes,
      alt,
      entityId,
      entityType,
      maxSize,
      mediaType,
      onUpload,
      previewUrl,
      role,
    ],
  );

  const handleRemove = useCallback(async () => {
    setError(null);
    try {
      if (entityType && entityId) {
        await unlinkProductAsset({
          entityType,
          entityId,
          role,
          assetId,
        });
      }
      setPreview(undefined);
      setAssetId(undefined);
      onRemove?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao remover");
    }
  }, [assetId, entityId, entityType, onRemove, role]);

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="relative">
        <label
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/50 px-4 py-6 transition hover:border-primary/40",
            loading && "pointer-events-none opacity-70",
          )}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files[0];
            if (file) void handleFile(file);
          }}
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt={alt || ""} className="max-h-40 rounded-lg object-contain" />
          ) : (
            <>
              <Upload className="mb-2 h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
              <span className="text-xs text-muted-foreground">Arraste ou clique para enviar</span>
            </>
          )}
          <input
            type="file"
            accept={acceptedTypes.join(",")}
            className="sr-only"
            disabled={loading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
        </label>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/50">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        {preview && !loading && (
          <button
            type="button"
            className="absolute right-2 top-2 rounded-full bg-background/90 p-1 shadow"
            aria-label="Remover imagem"
            onClick={() => void handleRemove()}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {error && (
        <div className="flex items-center gap-2">
          <p className="text-xs text-danger">{error}</p>
          <button
            type="button"
            className="text-xs underline"
            onClick={() => setError(null)}
          >
            OK
          </button>
        </div>
      )}
    </div>
  );
}
