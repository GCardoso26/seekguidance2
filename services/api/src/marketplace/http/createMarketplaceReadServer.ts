import type { IncomingMessage, ServerResponse } from "node:http";
import { createServer, type Server } from "node:http";
import type { MarketplaceQueryService } from "../read/MarketplaceQueryService.js";
import {
  toCardOffersResponse,
  toListingResponse,
  toSellerResponse,
} from "../read/mappers.js";

export interface MarketplaceReadServerDeps {
  queries: MarketplaceQueryService;
  port?: number;
}

function readUrl(req: IncomingMessage): URL {
  return new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": status >= 400 ? "no-store" : "public, max-age=15",
  });
  res.end(body);
}

/**
 * Marketplace Read API — GET /api/v1/marketplace/* only.
 * Separate root from /api/v1/search (ADR-007). References Catalog IDs only.
 */
export function createMarketplaceReadServer(deps: MarketplaceReadServerDeps): Server {
  return createServer(async (req, res) => {
    try {
      if (req.method !== "GET" && req.method !== "HEAD") {
        sendJson(res, 405, { error: "method_not_allowed" });
        return;
      }

      const url = readUrl(req);
      const path = url.pathname.replace(/\/$/, "") || "/";

      if (path === "/health" || path === "/api/v1/marketplace/health") {
        sendJson(res, 200, { status: "ok", root: "/api/v1/marketplace" });
        return;
      }

      if (path === "/api/v1/marketplace/listings") {
        const cardId = url.searchParams.get("cardId");
        if (!cardId) {
          sendJson(res, 400, { error: "cardId_required" });
          return;
        }
        const offers = await deps.queries.listCardOffers(cardId);
        sendJson(res, 200, { items: offers.map(toListingResponse) });
        return;
      }

      const listingMatch = /^\/api\/v1\/marketplace\/listings\/([^/]+)$/.exec(path);
      if (listingMatch) {
        const listing = await deps.queries.getListing(decodeURIComponent(listingMatch[1]!));
        if (!listing) {
          sendJson(res, 404, { error: "listing_not_found" });
          return;
        }
        sendJson(res, 200, toListingResponse(listing));
        return;
      }

      const cardOffersMatch = /^\/api\/v1\/marketplace\/cards\/([^/]+)\/offers$/.exec(path);
      if (cardOffersMatch) {
        const cardId = decodeURIComponent(cardOffersMatch[1]!);
        const offers = await deps.queries.listCardOffers(cardId);
        sendJson(res, 200, toCardOffersResponse(cardId, offers));
        return;
      }

      const sellerListingsMatch = /^\/api\/v1\/marketplace\/sellers\/([^/]+)\/listings$/.exec(path);
      if (sellerListingsMatch) {
        const sellerId = decodeURIComponent(sellerListingsMatch[1]!);
        const listings = await deps.queries.listSellerListings(sellerId);
        sendJson(res, 200, { items: listings.map(toListingResponse) });
        return;
      }

      const sellerMatch = /^\/api\/v1\/marketplace\/sellers\/([^/]+)$/.exec(path);
      if (sellerMatch) {
        const seller = await deps.queries.getSeller(decodeURIComponent(sellerMatch[1]!));
        if (!seller) {
          sendJson(res, 404, { error: "seller_not_found" });
          return;
        }
        sendJson(res, 200, toSellerResponse(seller));
        return;
      }

      sendJson(res, 404, { error: "not_found" });
    } catch (err) {
      sendJson(res, 500, {
        error: "internal_error",
        message: err instanceof Error ? err.message : String(err),
      });
    }
  });
}

export async function listenMarketplaceReadApi(
  deps: MarketplaceReadServerDeps,
): Promise<{ server: Server; port: number }> {
  const port = deps.port ?? Number(process.env.MARKETPLACE_API_PORT ?? "8788");
  const server = createMarketplaceReadServer(deps);
  await new Promise<void>((resolve) => server.listen(port, resolve));
  return { server, port };
}
