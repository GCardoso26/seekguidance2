import type { IncomingMessage, ServerResponse } from "node:http";
import { createServer, type Server } from "node:http";
import { getClock } from "../../shared/time/Clock.js";
import type { SearchQueryService } from "../../search/domain/SearchQueryService.js";
import type { SearchProjectionRepository } from "../../search/domain/SearchProjectionRepository.js";
import { buildCacheHeaders, notModified } from "./cache.js";
import { publicApiMetrics } from "./metrics.js";
import {
  toCardDetails,
  toCardSummary,
  toSearchResult,
  toSetResponse,
  toSuggestResponse,
  toVariant,
} from "../mappers/toPublicDto.js";

export interface PublicReadServerDeps {
  queries: SearchQueryService;
  projection: SearchProjectionRepository;
  port?: number;
}

function readUrl(req: IncomingMessage): URL {
  return new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
}

function sendJson(
  req: IncomingMessage,
  res: ServerResponse,
  status: number,
  payload: unknown,
  lastModifiedIso: string | null,
  cacheable = true,
): void {
  const body = JSON.stringify(payload);
  if (!cacheable || status >= 400) {
    res.writeHead(status, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(body);
    return;
  }

  const headers = buildCacheHeaders(body, lastModifiedIso);
  if (notModified(req.headers["if-none-match"], req.headers["if-modified-since"], headers)) {
    publicApiMetrics.recordCache(true);
    res.writeHead(304, {
      ETag: headers.etag,
      "Cache-Control": headers.cacheControl,
      "Last-Modified": headers.lastModified,
    });
    res.end();
    return;
  }

  publicApiMetrics.recordCache(false);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    ETag: headers.etag,
    "Cache-Control": headers.cacheControl,
    "Last-Modified": headers.lastModified,
  });
  res.end(body);
}

function num(v: string | null): number | undefined {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function bool(v: string | null): boolean | undefined {
  if (v == null) return undefined;
  if (v === "1" || v.toLowerCase() === "true") return true;
  if (v === "0" || v.toLowerCase() === "false") return false;
  return undefined;
}

/**
 * Public Read API — GET /api/v1/* only.
 * Never touches Catalog repositories.
 */
export function createPublicReadServer(deps: PublicReadServerDeps): Server {
  const server = createServer(async (req, res) => {
    const t0 = getClock().nowMs();
    try {
      if (req.method !== "GET" && req.method !== "HEAD") {
        sendJson(req, res, 405, { error: "method_not_allowed" }, null, false);
        return;
      }

      const url = readUrl(req);
      const path = url.pathname.replace(/\/$/, "") || "/";
      const lag = deps.projection.getLag();
      const lastMod = lag.lastEventAt;

      if (path === "/health" || path === "/api/v1/health") {
        const health = await deps.projection.getHealth();
        sendJson(
          req,
          res,
          200,
          {
            status: health.status,
            projection: health.projection,
            freshness: lag,
            metrics: publicApiMetrics.snapshot(),
          },
          lastMod,
          false,
        );
        return;
      }

      if (path === "/api/v1/search") {
        const q = url.searchParams.get("q") ?? undefined;
        const result = await deps.queries.search({
          q,
          name: url.searchParams.get("name") ?? undefined,
          oracle: url.searchParams.get("oracle") ?? undefined,
          setCode: url.searchParams.get("set") ?? url.searchParams.get("setCode") ?? undefined,
          language: url.searchParams.get("language") ?? undefined,
          finish: url.searchParams.get("finish") ?? undefined,
          storeId: url.searchParams.get("storeId") ?? undefined,
          hasStock: bool(url.searchParams.get("hasStock")),
          priceMin: num(url.searchParams.get("priceMin")),
          priceMax: num(url.searchParams.get("priceMax")),
          rarity: url.searchParams.get("rarity") ?? undefined,
          limit: num(url.searchParams.get("limit")),
          offset: num(url.searchParams.get("offset")),
        });
        publicApiMetrics.recordLatency(getClock().nowMs() - t0);
        publicApiMetrics.recordQuery(q ?? "", result.estimatedTotal);
        sendJson(req, res, 200, toSearchResult(result, q ?? null), lastMod);
        return;
      }

      if (path === "/api/v1/suggest") {
        const q = url.searchParams.get("q") ?? "";
        const limit = num(url.searchParams.get("limit")) ?? 8;
        const hits = await deps.queries.suggest(q, limit);
        publicApiMetrics.recordLatency(getClock().nowMs() - t0);
        publicApiMetrics.recordQuery(q, hits.length);
        sendJson(req, res, 200, toSuggestResponse(q, hits), lastMod);
        return;
      }

      if (path === "/api/v1/cards") {
        const q = url.searchParams.get("q") ?? undefined;
        const result = await deps.queries.search({
          q,
          setCode: url.searchParams.get("set") ?? undefined,
          language: url.searchParams.get("language") ?? undefined,
          limit: num(url.searchParams.get("limit")) ?? 20,
          offset: num(url.searchParams.get("offset")),
        });
        publicApiMetrics.recordLatency(getClock().nowMs() - t0);
        publicApiMetrics.recordQuery(q ?? "", result.estimatedTotal);
        sendJson(
          req,
          res,
          200,
          {
            items: result.hits.map((h) => toCardSummary(h.document)),
            estimatedTotal: result.estimatedTotal,
            projection: result.projection,
          },
          lastMod,
        );
        return;
      }

      const cardMatch = /^\/api\/v1\/cards\/([^/]+)$/.exec(path);
      if (cardMatch) {
        const card = await deps.queries.getCard(decodeURIComponent(cardMatch[1]!));
        if (!card) {
          sendJson(req, res, 404, { error: "card_not_found" }, null, false);
          return;
        }
        publicApiMetrics.recordLatency(getClock().nowMs() - t0);
        sendJson(req, res, 200, toCardDetails(card), card.updatedAt || lastMod);
        return;
      }

      if (path === "/api/v1/sets") {
        const code = url.searchParams.get("code");
        if (code) {
          const set = await deps.queries.getSet(code);
          if (!set) {
            sendJson(req, res, 404, { error: "set_not_found" }, null, false);
            return;
          }
          sendJson(req, res, 200, toSetResponse(set), lastMod);
          return;
        }
        // Listing all sets requires aggregation — return empty list contract-stable for v1
        sendJson(req, res, 200, { items: [] as unknown[], note: "use_?code=LEA" }, lastMod);
        return;
      }

      const setMatch = /^\/api\/v1\/sets\/([^/]+)$/.exec(path);
      if (setMatch) {
        const set = await deps.queries.getSet(decodeURIComponent(setMatch[1]!));
        if (!set) {
          sendJson(req, res, 404, { error: "set_not_found" }, null, false);
          return;
        }
        sendJson(req, res, 200, toSetResponse(set), lastMod);
        return;
      }

      if (path === "/api/v1/variants") {
        const cardId = url.searchParams.get("cardId");
        const finish = url.searchParams.get("finish");
        if (!cardId) {
          sendJson(req, res, 400, { error: "cardId_required" }, null, false);
          return;
        }
        const card = await deps.queries.getCard(cardId);
        if (!card) {
          sendJson(req, res, 404, { error: "card_not_found" }, null, false);
          return;
        }
        const finishes = finish ? [finish] : card.finishes;
        sendJson(
          req,
          res,
          200,
          { items: finishes.map((f) => toVariant(card, f)) },
          card.updatedAt || lastMod,
        );
        return;
      }

      const variantMatch = /^\/api\/v1\/variants\/([^/]+)$/.exec(path);
      if (variantMatch) {
        const variantId = decodeURIComponent(variantMatch[1]!);
        const card = await deps.queries.getVariant(variantId);
        if (!card) {
          sendJson(req, res, 404, { error: "variant_not_found" }, null, false);
          return;
        }
        const finish = variantId.slice(variantId.lastIndexOf(":") + 1);
        sendJson(req, res, 200, toVariant(card, finish), card.updatedAt || lastMod);
        return;
      }

      sendJson(req, res, 404, { error: "not_found" }, null, false);
    } catch (err) {
      sendJson(
        req,
        res,
        500,
        { error: "internal_error", message: err instanceof Error ? err.message : String(err) },
        null,
        false,
      );
    }
  });

  return server;
}

export async function listenPublicReadApi(
  deps: PublicReadServerDeps,
): Promise<{ server: Server; port: number }> {
  const port = deps.port ?? Number(process.env.PUBLIC_API_PORT ?? "8787");
  const server = createPublicReadServer(deps);
  await new Promise<void>((resolve) => server.listen(port, resolve));
  return { server, port };
}
