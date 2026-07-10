"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CpfCheckoutModal } from "@/components/kyc/CpfCheckoutModal";
import { Button } from "@/components/ui/button";
import { useJudgeAuth } from "@/features/auth/AuthProvider";
import { needsCpfCompletion, useAccountStatus } from "@/hooks/useAccountStatus";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import {
  useTournamentRegistration,
  useTournamentRegistrationStatus,
} from "@/hooks/useTournamentRegistration";
import {
  canRegister,
  mapTournamentPublicStatus,
  registrationStatusLabel,
} from "@/lib/tournament-registration";
import { showToast } from "@/lib/toast";
import type { TournamentRegistrationStatus } from "@/types/tournament-registration";

type Props = {
  tournamentId: string;
  tournamentStatus: string;
  entryFeeCents: number;
  registeredCount: number;
  maxPlayers: number | null;
};

function formatFee(cents: number) {
  if (cents <= 0) return "Gratuito";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function TournamentRegistrationPanel({
  tournamentId,
  tournamentStatus,
  entryFeeCents,
  registeredCount,
  maxPlayers,
}: Props) {
  const router = useRouter();
  const { user } = useJudgeAuth();
  const { data: accountStatus } = useAccountStatus();
  const { data: profile } = usePlayerProfile(user ? "me" : "");
  const { data: regStatus } = useTournamentRegistrationStatus(tournamentId, Boolean(user));
  const { register, cancel } = useTournamentRegistration(tournamentId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cpfOpen, setCpfOpen] = useState(false);

  const status: TournamentRegistrationStatus = regStatus?.status ?? "not_registered";
  const publicOpen = mapTournamentPublicStatus(tournamentStatus) === "open";
  const eligibility = canRegister({
    tournamentStatus,
    registeredCount,
    maxPlayers,
    registrationStatus: status,
    isLoggedIn: Boolean(user),
    canPurchase: !needsCpfCompletion(accountStatus),
  });

  const handleRegisterClick = () => {
    if (!user) {
      router.push(`/entrar?redirect=/tournament/${tournamentId}`);
      return;
    }
    if (needsCpfCompletion(accountStatus)) {
      setCpfOpen(true);
      return;
    }
    if (entryFeeCents > 0) {
      return;
    }
    setConfirmOpen(true);
  };

  const confirmFree = async () => {
    try {
      const name = profile?.displayName ?? user?.email?.split("@")[0];
      await register.mutateAsync(name);
      setConfirmOpen(false);
      showToast("Inscrição confirmada!", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Falha na inscrição", "error");
    }
  };

  const handleCancel = async () => {
    try {
      await cancel.mutateAsync();
      showToast("Inscrição cancelada", "success");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Falha ao cancelar", "error");
    }
  };

  return (
    <section
      className="surface-card rounded-xl border border-border p-6"
      data-testid="tournament-registration-panel"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Taxa de inscrição</p>
          <p className="text-xl font-semibold text-primary">{formatFee(entryFeeCents)}</p>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <p>
            Vagas: {registeredCount}
            {maxPlayers != null ? ` / ${maxPlayers}` : ""}
          </p>
          {user && (
            <p data-testid="registration-user-status">{registrationStatusLabel(status)}</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {status === "confirmed" ? (
          <Button
            type="button"
            variant="outline"
            disabled={!regStatus?.can_cancel || cancel.isPending}
            onClick={() => void handleCancel()}
            data-testid="tournament-cancel-registration"
          >
            Cancelar inscrição
          </Button>
        ) : status === "pending_payment" ? (
          <Button type="button" asChild data-testid="tournament-complete-payment">
            <a href={`/tournament/${tournamentId}/checkout`}>Concluir pagamento</a>
          </Button>
        ) : entryFeeCents > 0 && eligibility.allowed ? (
          <Link
            href={`/tournament/${tournamentId}/checkout`}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90-light"
            data-testid="tournament-register-btn"
          >
            Inscrever-se
          </Link>
        ) : (
          <Button
            type="button"
            className="bg-primary text-primary-foreground hover:bg-primary/90-light"
            disabled={!publicOpen || !eligibility.allowed || register.isPending}
            onClick={handleRegisterClick}
            data-testid="tournament-register-btn"
          >
            {register.isPending ? "Inscrevendo…" : "Inscrever-se"}
          </Button>
        )}
      </div>

      {!eligibility.allowed && eligibility.reason === "registration_closed" && (
        <p className="mt-2 text-sm text-muted-foreground">Inscrições fechadas para este torneio.</p>
      )}
      {eligibility.reason === "full" && (
        <p className="mt-2 text-sm text-amber-300">Torneio lotado.</p>
      )}

      <Dialog.Root open={confirmOpen} onOpenChange={setConfirmOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-foreground/50" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-50 w-[min(100vw-2rem,24rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-background p-6"
            data-testid="tournament-register-confirm-modal"
          >
            <Dialog.Title className="text-lg font-semibold">Confirmar inscrição</Dialog.Title>
            <p className="mt-2 text-sm text-muted-foreground">
              Inscrição gratuita. Deseja confirmar sua participação?
            </p>
            <div className="mt-4 flex gap-2">
              <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)}>
                Voltar
              </Button>
              <Button
                type="button"
                className="bg-primary text-primary-foreground"
                disabled={register.isPending}
                onClick={() => void confirmFree()}
                data-testid="tournament-register-confirm-btn"
              >
                Confirmar
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <CpfCheckoutModal open={cpfOpen} onClose={() => setCpfOpen(false)} />
    </section>
  );
}
