/** Indica se o lojista ainda precisa abrir o fluxo Stripe (vs. apenas aguardar análise). */
export function needsOnboardingContinue(
  status: string,
  rejectionReason?: string | null,
): boolean {
  if (status === "verified" || status === "none") return false;
  if (status === "rejected" || status === "restricted") return true;
  if (status === "pending") {
    const reason = (rejectionReason ?? "").toLowerCase();
    if (!reason) return true;
    if (reason.includes("em verificação") || reason.includes("aguardando verificação")) {
      return false;
    }
    return true;
  }
  return true;
}

export function isKycAwaitingReview(
  status: string,
  rejectionReason?: string | null,
): boolean {
  if (status !== "pending") return false;
  const reason = (rejectionReason ?? "").toLowerCase();
  return reason.includes("em verificação") || reason.includes("aguardando verificação");
}
