import type { SellerCouponStatus } from "@/types/seller-coupon";

const LABELS: Record<SellerCouponStatus, string> = {
  active: "Ativo",
  inactive: "Inativo",
  expired: "Expirado",
};

const COLORS: Record<SellerCouponStatus, string> = {
  active: "bg-emerald-500/20 text-emerald-200",
  inactive: "bg-white/10 text-luxury-mist",
  expired: "bg-red-500/20 text-red-200",
};

export function CouponStatusBadge({ status }: { status: SellerCouponStatus }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${COLORS[status]}`} data-testid={`coupon-status-${status}`}>
      {LABELS[status]}
    </span>
  );
}
