"use client";

import { useState } from "react";
import { PageHeader, PageShell } from "@/components/seller-dashboard/PageShell";
import { IngestionProgress } from "@/components/admin/IngestionProgress";
import { UploadDropzone } from "@/components/admin/UploadDropzone";
import { useUserRole } from "@/hooks/useUserRole";
import { reindexGame, uploadIngestionPdf } from "@/services/infrastructureApi";

export default function AdminIngestionUploadPage() {
  const { canIngest } = useUserRole();
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(file: File) {
    setUploading(true);
    setMessage(null);
    try {
      const res = await uploadIngestionPdf("swu", file);
      setMessage(res.note ?? "PDF recebido. Processamento iniciado para SWU.");
      await reindexGame("swu").catch(() => undefined);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Falha no upload");
    } finally {
      setUploading(false);
    }
  }

  if (!canIngest) {
    return (
      <PageShell>
        <PageHeader title="Ingestão SWU" />
        <p className="text-danger">Permissão de ingestão necessária.</p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Ingestão — Star Wars Unlimited"
        description="PDF → parsing → chunks → embeddings → indexação"
      />

      <div className="grid gap-8 md:grid-cols-2">
        <section className="rounded-xl border border-border p-6">
          <h2 className="mb-4 text-lg font-semibold">Upload de regras (PDF)</h2>
          <UploadDropzone onUpload={handleUpload} disabled={uploading} />
          {message && (
            <p className="mt-4 text-sm text-muted-foreground" role="status">
              {message}
            </p>
          )}
        </section>
        <section className="rounded-xl border border-border p-6">
          <h2 className="mb-4 text-lg font-semibold">Progresso</h2>
          <IngestionProgress gameSlug="swu" />
        </section>
      </div>
    </PageShell>
  );
}
