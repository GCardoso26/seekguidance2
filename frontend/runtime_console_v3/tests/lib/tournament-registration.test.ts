import { describe, expect, it } from "vitest";
import {
  canRegister,
  formatAnonymousPlayer,
  isPaymentExpired,
  mapTournamentPublicStatus,
  parseTournamentRegistrationPayload,
  resolveRegistrationStatus,
} from "@/lib/tournament-registration";

describe("tournament-registration", () => {
  it("valida payload de inscrição", () => {
    const ok = parseTournamentRegistrationPayload({ display_name: "Player One" });
    expect(ok.success).toBe(true);

    const bad = parseTournamentRegistrationPayload({ display_name: "A" });
    expect(bad.success).toBe(false);
  });

  it("resolve status pending → confirmed → cancelled", () => {
    expect(
      resolveRegistrationStatus({
        paymentStatus: "pending",
        paymentCreatedAt: new Date().toISOString(),
      }),
    ).toBe("pending_payment");

    expect(
      resolveRegistrationStatus({
        participantStatus: "registered",
      }),
    ).toBe("confirmed");

    const oldPending = new Date(Date.now() - 31 * 60 * 1000).toISOString();
    expect(
      resolveRegistrationStatus({
        paymentStatus: "pending",
        paymentCreatedAt: oldPending,
      }),
    ).toBe("cancelled");

    expect(isPaymentExpired(oldPending)).toBe(true);
  });

  it("aplica regras de elegibilidade para inscrição", () => {
    const base = {
      tournamentStatus: "registration_open",
      registeredCount: 10,
      maxPlayers: 32,
      registrationStatus: "not_registered" as const,
      isLoggedIn: true,
      canPurchase: true,
    };

    expect(canRegister(base).allowed).toBe(true);
    expect(canRegister({ ...base, isLoggedIn: false }).reason).toBe("login_required");
    expect(canRegister({ ...base, canPurchase: false }).reason).toBe("cpf_required");
    expect(canRegister({ ...base, registeredCount: 32, maxPlayers: 32 }).reason).toBe("full");
    expect(
      canRegister({ ...base, registrationStatus: "confirmed" }).reason,
    ).toBe("already_registered");

    expect(mapTournamentPublicStatus("registration_open")).toBe("open");
    expect(mapTournamentPublicStatus("in_progress")).toBe("in_progress");
    expect(formatAnonymousPlayer(0)).toBe("Jogador #1");
  });
});
