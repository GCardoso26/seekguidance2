/** Query string para GET /api/seller/listings com paginação e filtros suportados pela API. */

export function buildSellerListingsQuery(
  page: number,
  limit: number,
  options?: { status?: string },
): string {
  const safePage = Math.max(1, page);
  const params = new URLSearchParams({
    page: String(safePage),
    limit: String(limit),
  });
  if (options?.status) params.set("status", options.status);
  return params.toString();
}
