"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadEventBanner } from "@/lib/supabase/storage";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPT = ["image/jpeg", "image/png", "image/webp"];

type Props = {
  value?: string | null;
  onChange: (url: string | null) => void;
  className?: string;
};

export function EventBannerUpload({ value, onChange, className }: Props) {
  const [preview, setPreview] = useState<string | undefined>(value ?? undefined);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPreview(value ?? undefined);
  }, [value]);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      if (!ACCEPT.includes(file.type)) {
        setError("Formato inválido. Use JPG, PNG ou WebP.");
        return;
      }
      if (file.size > MAX_BYTES) {
        setError("Arquivo muito grande (máx. 2 MB).");
        return;
      }
      setLoading(true);
      try {
        const local = URL.createObjectURL(file);
        setPreview(local);
        const supabase = createSupabaseBrowserClient();
        const {
          data: { user },
        } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
        if (!user?.id) throw new Error("Faça login para enviar o banner");
        const url = await uploadEventBanner(file, user.id);
        setPreview(url);
        onChange(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Falha no upload");
        setPreview(value ?? undefined);
      } finally {
        setLoading(false);
      }
    },
    [onChange, value],
  );

  return (
    <div className={cn("space-y-2", className)} data-testid="event-banner-upload">
      <p className="text-sm text-muted-foreground">Banner 350×500 px (proporção 2:3)</p>
      {preview ? (
        <div className="relative w-[140px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Preview do banner"
            className="aspect-[7/10] w-full rounded-lg border border-border object-cover"
          />
          <button
            type="button"
            className="absolute right-1 top-1 rounded-full bg-background/90 p-1"
            onClick={() => {
              setPreview(undefined);
              onChange(null);
            }}
            aria-label="Remover banner"
            data-testid="event-banner-remove"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className="flex aspect-[7/10] w-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 text-xs text-muted-foreground hover:border-primary/40">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          <span>{loading ? "Enviando…" : "Carregar"}</span>
          <input
            type="file"
            accept={ACCEPT.join(",")}
            className="hidden"
            disabled={loading}
            data-testid="event-banner-input"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
        </label>
      )}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
