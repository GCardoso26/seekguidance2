"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { needsCpfCompletion, useAccountStatus } from "@/hooks/useAccountStatus";
import { useSellerStore } from "@/hooks/useSellerStore";
import { isKycAwaitingReview, needsOnboardingContinue } from "@/lib/kyc-onboarding";
import { syncMerchantOnboardingFromStripe } from "@/lib/merchant-onboarding-return";

function parseApiDetail(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "Falha ao iniciar KYC";
  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (detail && typeof detail === "object" && "message" in detail) {
    return String((detail as { message?: string }).message ?? "Falha ao iniciar KYC");
  }
  return "Falha ao iniciar KYC";
}

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

async function syncOnboardingStatus(storeId: string | null): Promise<void> {
  await syncMerchantOnboardingFromStripe(storeId);
}

async function fetchOnboardingLink(storeId: string | null): Promise<{ onboarding_url?: string }> {
  const body: { store_id?: string } = {};
  if (storeId) body.store_id = storeId;

  const res = await fetch("/api/merchant/onboarding", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(parseApiDetail(payload));
  }
  return payload as { onboarding_url?: string };
}

export function MerchantKycCard() {
  const router = useRouter();
  const { storeId, isLoading: storeLoading } = useSellerStore();
  const { data, refetch, isError: accountStatusError, isLoading: accountStatusLoading } =
    useAccountStatus();
  const kyc = data?.merchant;
  const status = kyc?.kyc_status ?? "none";
  const cpfPending = needsCpfCompletion(data);
  const awaitingReview = isKycAwaitingReview(status, kyc?.rejection_reason);
  const showContinueButton = needsOnboardingContinue(status, kyc?.rejection_reason);
  const [onboardingRedirecting, setOnboardingRedirecting] = useState(false);
  const [onboardingSyncing, setOnboardingSyncing] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const onboardingQueryHandled = useRef(false);
  const refreshAttemptStarted = useRef(false);

  const redirectToOnboarding = (url: string) => {
    setOnboardingRedirecting(true);
    window.location.href = url;
  };

  const onboardingMutation = useMutation({
    mutationFn: () => fetchOnboardingLink(storeId),
    onMutate: () => setOnboardingError(null),
    onSuccess: (payload) => {
      if (payload.onboarding_url) {
        redirectToOnboarding(payload.onboarding_url);
        return;
      }
      setOnboardingError(
        "Não foi possível obter o link do Stripe. Tente novamente em instantes ou contate o suporte.",
      );
      void refetch();
    },
    onError: (error: Error) => {
      setOnboardingError(error.message);
    },
  });

  useEffect(() => {
    if (typeof window === "undefined" || onboardingQueryHandled.current) return;
    const mode = new URLSearchParams(window.location.search).get("onboarding");
    if (!mode) return;

    const clearOnboardingQuery = () => {
      onboardingQueryHandled.current = true;
      router.replace("/vendedor/painel");
    };

    if (mode === "success") {
      if (storeLoading) return;
      if (onboardingQueryHandled.current) return;
      onboardingQueryHandled.current = true;
      setOnboardingSyncing(true);
      void (async () => {
        try {
          await syncOnboardingStatus(storeId);
          await refetch();
        } finally {
          setOnboardingSyncing(false);
          router.replace("/vendedor/painel");
        }
      })();
      return;
    }

    if (mode !== "refresh") return;
    if (storeLoading || accountStatusLoading) return;
    if (refreshAttemptStarted.current) return;
    if (status === "verified") {
      clearOnboardingQuery();
      return;
    }

    refreshAttemptStarted.current = true;
    setOnboardingRedirecting(true);
    void (async () => {
      try {
        const payload = await fetchOnboardingLink(storeId);
        if (payload.onboarding_url) {
          onboardingQueryHandled.current = true;
          redirectToOnboarding(payload.onboarding_url);
          return;
        }
        setOnboardingRedirecting(false);
        setOnboardingError(
          "Não foi possível continuar o cadastro. Clique em «Continuar cadastro» para tentar de novo.",
        );
        clearOnboardingQuery();
      } catch (error) {
        setOnboardingRedirecting(false);
        setOnboardingError(
          error instanceof Error ? error.message : "Falha ao retomar cadastro no Stripe.",
        );
        clearOnboardingQuery();
      }
    })();
  }, [accountStatusLoading, refetch, router, status, storeId, storeLoading]);

  if (onboardingRedirecting || onboardingSyncing) {
    return (
      <div className="surface-card p-4 text-center text-sm text-muted-foreground">
        {onboardingSyncing
          ? "Atualizando status do seu cadastro…"
          : "Redirecionando para continuar seu cadastro no Stripe…"}
      </div>
    );
  }

  if (status === "none") {
    return (
      <div className="surface-card p-4">
        <h3 className="font-semibold">Quero vender</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Ative o perfil lojista e complete a verificação de identidade (KYC) para publicar produtos.
        </p>
        {accountStatusError && (
          <p className="mt-2 text-sm text-warning">
            Não foi possível carregar o status da conta. Tente novamente em instantes.
          </p>
        )}
        {cpfPending && (
          <p className="mt-2 text-sm text-warning">
            Recomendamos{" "}
            <Link href="/completar-perfil" className="underline">
              completar seu CPF
            </Link>{" "}
            antes de vender.
          </p>
        )}
        <Button
          className="mt-3"
          disabled={storeLoading || onboardingMutation.isPending}
          onClick={() => void onboardingMutation.mutate()}
        >
          {onboardingMutation.isPending ? "Abrindo…" : "Tornar-se lojista"}
        </Button>
        {(onboardingMutation.isError || onboardingError) && (
          <p className="mt-2 text-sm text-danger">
            {onboardingError ?? onboardingMutation.error?.message}
          </p>
        )}
      </div>
    );
  }

  const style = STATUS_STYLES[status] ?? STATUS_STYLES.pending;

  return (
    <div className={`rounded-xl border p-4 ${style}`}>
      <h3 className="font-semibold">
        Status KYC —{" "}
        {awaitingReview ? "Documentação em análise" : (STATUS_LABELS[status] ?? status)}
      </h3>
      {status === "pending" && awaitingReview && (
        <p className="mt-2 text-sm">
          Recebemos seus dados. A Stripe está analisando — isso pode levar algumas horas. Você será
          notificado quando puder publicar produtos.
        </p>
      )}
      {status === "pending" && !awaitingReview && (
        <p className="mt-2 text-sm">Complete seu cadastro no provedor de pagamentos para publicar produtos.</p>
      )}
      {status === "rejected" && kyc?.rejection_reason && (
        <p className="mt-2 text-sm">Motivo: {kyc.rejection_reason}</p>
      )}
      {status === "restricted" && (
        <p className="mt-2 text-sm">Sua conta tem limitações temporárias. Envie as informações solicitadas.</p>
      )}
      {showContinueButton && (
        <Button
          variant="outline"
          className="mt-3 border-border"
          disabled={storeLoading || onboardingMutation.isPending}
          onClick={() => void onboardingMutation.mutate()}
        >
          {onboardingMutation.isPending ? "Abrindo…" : status === "rejected" ? "Reenviar documentação" : "Continuar cadastro"}
        </Button>
      )}
      {status === "verified" && (
        <p className="mt-2 text-sm">Você pode publicar produtos e receber pagamentos.</p>
      )}
      {(onboardingMutation.isError || onboardingError) && (
        <p className="mt-2 text-sm text-danger">
          {onboardingError ?? onboardingMutation.error?.message}
        </p>
      )}
    </div>
  );
}
