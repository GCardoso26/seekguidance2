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
      <EmptyState
        icon={<WifiOff className="h-10 w-10 text-muted-foreground" aria-hidden />}
        title="Você está offline"
        description="Algumas funcionalidades podem não estar disponíveis. Verifique sua conexão e tente novamente."
        action={{ label: "Tentar novamente", href: "/" }}
      />
    </div>
  );
}
