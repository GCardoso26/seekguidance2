"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  accept?: string;
  maxSize?: number;
  onUpload: (file: File) => void | Promise<void>;
  disabled?: boolean;
};

export function UploadDropzone({
  accept = ".pdf",
  maxSize = 50 * 1024 * 1024,
  onUpload,
  disabled,
}: Props) {
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File | undefined) => {
      setError(null);
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        setError("Apenas ficheiros PDF.");
        return;
      }
      if (file.size > maxSize) {
        setError(`Ficheiro excede ${Math.round(maxSize / (1024 * 1024))}MB.`);
        return;
      }
      await onUpload(file);
    },
    [maxSize, onUpload],
  );

  return (
    <div className="space-y-2">
      <label
        className={cn(
          "flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition",
          drag ? "border-amber-400 bg-amber-400/5" : "border-border hover:border-amber-400/60",
          disabled && "pointer-events-none opacity-50",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void handleFile(e.dataTransfer.files[0]);
        }}
      >
        <input
          type="file"
          accept={accept}
          className="sr-only"
          disabled={disabled}
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
        <p className="text-sm font-medium">Arraste o PDF das regras ou clique para selecionar</p>
        <p className="mt-1 text-xs text-muted-foreground">Máx. {Math.round(maxSize / (1024 * 1024))}MB</p>
      </label>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
