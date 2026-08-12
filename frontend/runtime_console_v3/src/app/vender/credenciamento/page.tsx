import type { Metadata } from "next";
import { AccreditationWizard } from "@/components/seller-accreditation/AccreditationWizard";

export const metadata: Metadata = {
  title: "Credenciamento de loja — JudgeTCG",
  description: "Solicite credenciamento da sua hobby store com CNPJ no JudgeTCG.",
};

export default function VenderCredenciamentoPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div
        className="border-b border-border"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in oklch, var(--muted) 55%, transparent), var(--background))",
        }}
      >
        <AccreditationWizard />
      </div>
    </main>
  );
}
