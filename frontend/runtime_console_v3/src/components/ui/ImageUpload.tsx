"use client";

import { useCallback, useState } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ["image/jpeg", "image/png", "image/webp"];

type Props = {
  label?: string;
  maxSize?: number;
  acceptedTypes?: string[];
  previewUrl?: string;
  onUpload: (url: string) => void;
  className?: string;
};

/** Upload com preview local. TODO: integrar Vercel Blob quando BLOB_READ_WRITE_TOKEN estiver configurado. */
export function ImageUpload({
  label = "Imagem",
  maxSize = MAX_BYTES,
  acceptedTypes = ACCEPT,
  previewUrl,
  onUpload,
  className,
}: Props) {
  const [preview, setPreview] = useState<string | undefined>(previewUrl);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      if (!acceptedTypes.includes(file.type)) {
        setError("Formato inválido. Use JPG, PNG ou WebP.");
        return;
      }
      if (file.size > maxSize) {
        setError("Arquivo muito grande (máx. 5 MB).");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const url = String(reader.result);
        setPreview(url);
        onUpload(url);
      };
      reader.readAsDataURL(file);
    },
    [acceptedTypes, maxSize, onUpload],
  );

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <label
        className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-muted/50 px-4 py-6 transition hover:border-primary/40"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="max-h-40 rounded-lg object-contain" />
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
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </label>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
