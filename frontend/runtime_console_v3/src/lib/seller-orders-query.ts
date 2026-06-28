/** Query string para GET /api/seller/orders com paginação e filtros. */

export function buildSellerOrdersQuery(
  page: number,
  limit: number,
  status?: string,
): string {
  const safePage = Math.max(1, page);
  const params = new URLSearchParams({
    page: String(safePage),
    limit: String(limit),
  });
  if (status) params.set("status", status);
  return params.toString();
}
