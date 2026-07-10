"use client";

import { useCallback, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadImage } from "@/lib/supabase/storage";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { showToast } from "@/lib/toast";

const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPT = ["image/jpeg", "image/png", "image/webp"];

type Props = {
  label?: string;
  onUpload: (url: string) => void;
  className?: string;
};

export function CommunityImageUpload({ label = "Imagem", onUpload, className }: Props) {
  const { user } = useJudgeAuth();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      if (!user?.id) {
        setError("Faça login para enviar imagens.");
        return;
      }
      if (!ACCEPT.includes(file.type)) {
        setError("Use JPG, PNG ou WebP.");
        return;
      }
      if (file.size > MAX_BYTES) {
        setError("Arquivo muito grande (máx. 8 MB).");
        return;
      }
      setUploading(true);
      try {
        const url = await uploadImage(file, user.id);
        setPreview(url);
        onUpload(url);
        showToast("Imagem enviada!", "success");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Falha no upload";
        setError(msg);
        showToast(msg, "error");
      } finally {
        setUploading(false);
      }
    },
    [onUpload, user?.id],
  );

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <label
        className={cn(
          "flex min-h-[44px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/50 px-4 py-6 transition hover:border-primary/40",
          uploading && "pointer-events-none opacity-60",
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
          <img src={preview} alt="Preview do upload" className="max-h-40 rounded-lg object-contain" />
        ) : uploading ? (
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        ) : (
          <>
            <Upload className="mb-2 h-6 w-6 text-muted-foreground" strokeWidth={1.5} aria-hidden />
            <span className="text-xs text-muted-foreground">Arraste ou clique (comprimido para WebP)</span>
          </>
        )}
        <input
          type="file"
          accept={ACCEPT.join(",")}
          className="sr-only"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
      </label>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
