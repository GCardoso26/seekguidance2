type Props = {
  plan?: string;
  className?: string;
};

export function ProBadge({ plan, className = "" }: Props) {
  if (plan !== "pro" && plan !== "enterprise") return null;
  const label = plan === "enterprise" ? "Enterprise" : "Pro";
  return (
    <span
      className={`inline-flex items-center rounded-full bg-luxury-gold/20 px-2 py-0.5 text-xs font-semibold text-luxury-gold ${className}`}
    >
      {label}
    </span>
  );
}
