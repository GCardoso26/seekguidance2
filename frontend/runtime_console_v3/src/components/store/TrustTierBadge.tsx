type TrustTier = {
  id: string;
  label: string;
  emoji?: string;
};

const STYLES: Record<string, string> = {
  verified: "border-success/40 bg-success/10 text-success",
  established: "border-primary/40 bg-primary/10 text-primary",
  recommended: "border-warning/40 bg-warning/10 text-warning",
};

export function TrustTierBadge({
  tier,
  className = "",
}: {
  tier?: TrustTier | string | null;
  className?: string;
}) {
  if (!tier) return null;
  const id = typeof tier === "string" ? tier : tier.id;
  const label =
    typeof tier === "string"
      ? id === "verified"
        ? "Loja verificada"
        : id === "established"
          ? "Loja estabelecida"
          : id === "recommended"
            ? "Loja recomendada"
            : id
      : tier.label;
  const emoji =
    typeof tier === "string"
      ? id === "verified"
        ? "🟢"
        : id === "established"
          ? "🔵"
          : id === "recommended"
            ? "⭐"
            : ""
      : tier.emoji || "";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${STYLES[id] || "border-border text-muted-foreground"} ${className}`}
    >
      {emoji ? <span aria-hidden>{emoji}</span> : null}
      {label}
    </span>
  );
}
