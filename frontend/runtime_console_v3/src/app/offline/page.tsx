import { EmptyState } from "@/components/ui/EmptyState";
import { WifiOff } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="flex flex-col items-center">
        <WifiOff className="mb-4 h-10 w-10 text-zinc-500" aria-hidden />
        <EmptyState
          type="generic"
          title="Você está offline"
          description="Algumas funcionalidades podem não estar disponíveis. Verifique sua conexão e tente novamente."
          action={{ label: "Tentar novamente", href: "/" }}
        />
      </div>
    </div>
  );
}
