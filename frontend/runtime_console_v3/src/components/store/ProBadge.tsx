type Props = {
  plan?: string;
  className?: string;
};

const LABELS: Record<string, string> = {
  lojista: "Lojista",
  pro: "Pro",
  enterprise: "Enterprise",
};

export function ProBadge({ plan, className = "" }: Props) {
  if (!plan || plan === "free" || !LABELS[plan]) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full bg-luxury-gold/20 px-2 py-0.5 text-xs font-semibold text-luxury-gold ${className}`}
    >
      {LABELS[plan]}
    </span>
  );
}
