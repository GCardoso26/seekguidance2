"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Suspense, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useAccountStatus } from "@/hooks/useAccountStatus";
import { useMerchantOnboardingSync } from "@/hooks/useMerchantOnboardingSync";
import { isKycAwaitingReview, needsOnboardingContinue } from "@/lib/kyc-onboarding";
import { syncMerchantOnboardingFromStripe } from "@/lib/merchant-onboarding-return";

function LojaSuspensaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasOnboardingQuery = searchParams.has("onboarding");
  const { syncing: onboardingSyncing } = useMerchantOnboardingSync(!hasOnboardingQuery);
  const { data, refetch, isLoading } = useAccountStatus({ refetchInterval: 10_000 });
  const staleSyncStarted = useRef(false);

  const merchant = data?.merchant;
  const status = merchant?.kyc_status ?? "restricted";
  const awaitingReview = isKycAwaitingReview(status, merchant?.rejection_reason);
  const needsContinue = needsOnboardingContinue(status, merchant?.rejection_reason);

  useEffect(() => {
    if (isLoading || !merchant) return;
    if (merchant.kyc_status === "verified") {
      router.replace("/vendedor/painel");
    }
  }, [isLoading, merchant, router]);

  useEffect(() => {
    if (hasOnboardingQuery || staleSyncStarted.current) return;
    staleSyncStarted.current = true;
    void (async () => {
      const mineRes = await fetch("/api/stores/mine");
      const stores = mineRes.ok ? ((await mineRes.json()) as Array<{ id?: string }>) : [];
      await syncMerchantOnboardingFromStripe(stores[0]?.id ?? null);
      await refetch();
    })();
  }, [hasOnboardingQuery, refetch]);

  const reonboardMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/merchant/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(String((payload as { detail?: string }).detail ?? "Falha ao reabrir cadastro"));
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

  const title =
    status === "rejected"
      ? "Loja suspensa — KYC recusado"
      : status === "pending" && awaitingReview
        ? "Verificação em análise"
        : "Loja com limitações";

  const description =
    status === "rejected"
      ? "Sua verificação de identidade foi recusada. Revise os dados enviados ou entre em contato com o suporte."
      : status === "pending" && awaitingReview
        ? "Recebemos sua documentação. A análise costuma levar até 2 dias úteis — avisaremos quando sua loja estiver liberada."
        : "Sua conta tem limitações temporárias. Complete o cadastro para voltar a publicar.";

  if (onboardingSyncing) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center p-6 text-center text-luxury-mist">
        <p className="text-sm">Atualizando status do cadastro Stripe…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col justify-center p-6 text-luxury-frost">
      <h1 className="text-2xl font-bold text-red-200">{title}</h1>
      <p className="mt-3 text-sm text-luxury-mist">{description}</p>
      {merchant?.rejection_reason && !awaitingReview && (
        <p className="mt-2 rounded-lg border border-red-500/30 bg-red-950/20 p-3 text-sm text-red-100">
          Motivo: {merchant.rejection_reason}
        </p>
      )}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {needsContinue && (
          <Button disabled={reonboardMutation.isPending} onClick={() => void reonboardMutation.mutate()}>
            {status === "rejected" ? "Reenviar documentação" : "Continuar cadastro"}
          </Button>
        )}
        <Button asChild variant="outline" className="border-white/20">
          <Link href="/loja">Voltar à loja</Link>
        </Button>
      </div>
      {reonboardMutation.isError && (
        <p className="mt-3 text-sm text-red-300">{reonboardMutation.error.message}</p>
      )}
      <p className="mt-8 text-xs text-luxury-mist">
        Dúvidas?{" "}
        <Link href="/suporte" className="text-luxury-gold underline">
          Fale com o suporte
        </Link>
      </p>
    </main>
  );
}

export default function LojaSuspensaPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto flex min-h-[70vh] max-w-lg items-center justify-center p-6 text-luxury-mist">
          <p className="text-sm">Carregando…</p>
        </main>
      }
    >
      <LojaSuspensaContent />
    </Suspense>
  );
}
