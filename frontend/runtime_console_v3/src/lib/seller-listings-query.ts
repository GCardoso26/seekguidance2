/** Query string para GET /api/seller/listings com paginação. */

export function buildSellerListingsQuery(page: number, limit: number): string {
  const safePage = Math.max(1, page);
  const params = new URLSearchParams({
    page: String(safePage),
    limit: String(limit),
  });
  return params.toString();
}
