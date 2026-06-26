"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAccountStatus } from "@/hooks/useAccountStatus";
import { useSellerStore } from "@/hooks/useSellerStore";

const STATUS_STYLES: Record<string, string> = {
  pending: "border-amber-500/40 bg-amber-950/30 text-amber-100",
  verified: "border-emerald-500/40 bg-emerald-950/30 text-emerald-100",
  rejected: "border-red-500/40 bg-red-950/30 text-red-100",
  restricted: "border-orange-500/40 bg-orange-950/30 text-orange-100",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Aguardando documentação",
  verified: "KYC aprovado",
  rejected: "KYC recusado",
  restricted: "Conta com limitações",
};

export function MerchantKycCard() {
  const { storeId } = useSellerStore();
  const { data, refetch } = useAccountStatus();
  const kyc = data?.merchant;
  const status = kyc?.kyc_status ?? "none";

  const { data: onboardingStatus } = useQuery({
    queryKey: ["merchant-onboarding-status"],
    queryFn: async () => {
      const res = await fetch("/api/merchant/onboarding/status");
      if (!res.ok) throw new Error("onboarding_status_failed");
      return res.json() as Promise<{
        onboarding_url?: string | null;
        link_refreshed?: boolean;
      }>;
    },
    enabled: Boolean(kyc && status !== "verified" && status !== "none"),
    staleTime: 60_000,
  });

  const onboardingMutation = useMutation({
    mutationFn: async () => {
      if (onboardingStatus?.onboarding_url) {
        return { onboarding_url: onboardingStatus.onboarding_url };
      }
      const res = await fetch("/api/merchant/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ store_id: storeId }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(String((payload as { detail?: string }).detail ?? "Falha ao iniciar KYC"));
      }
      return payload as { onboarding_url?: string };
    },
    onSuccess: (payload) => {
      if (payload.onboarding_url) {
        window.location.href = payload.onboarding_url;
      } else {
        void refetch();
      }
    },
  });

  if (status === "none") {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
        <h3 className="font-semibold">Quero vender</h3>
        <p className="mt-1 text-sm text-luxury-mist">
          Ative o perfil lojista e complete a verificação de identidade (KYC) para publicar produtos.
        </p>
        <Button className="mt-3" disabled={!storeId || onboardingMutation.isPending} onClick={() => void onboardingMutation.mutate()}>
          {onboardingMutation.isPending ? "Abrindo…" : "Tornar-se lojista"}
        </Button>
        {onboardingMutation.isError && (
          <p className="mt-2 text-sm text-red-300">{onboardingMutation.error.message}</p>
        )}
      </div>
    );
  }

  const style = STATUS_STYLES[status] ?? STATUS_STYLES.pending;

  return (
    <div className={`rounded-xl border p-4 ${style}`}>
      <h3 className="font-semibold">Status KYC — {STATUS_LABELS[status] ?? status}</h3>
      {status === "pending" && (
        <p className="mt-2 text-sm">Complete seu cadastro no provedor de pagamentos para publicar produtos.</p>
      )}
      {status === "rejected" && kyc?.rejection_reason && (
        <p className="mt-2 text-sm">Motivo: {kyc.rejection_reason}</p>
      )}
      {status === "restricted" && (
        <p className="mt-2 text-sm">Sua conta tem limitações temporárias. Envie as informações solicitadas.</p>
      )}
      {status !== "verified" && (
        <Button
          variant="outline"
          className="mt-3 border-white/20"
          disabled={onboardingMutation.isPending}
          onClick={() => void onboardingMutation.mutate()}
        >
          {status === "rejected" ? "Reenviar documentação" : "Continuar cadastro"}
        </Button>
      )}
      {status === "verified" && (
        <p className="mt-2 text-sm">Você pode publicar produtos e receber pagamentos.</p>
      )}
    </div>
  );
}
