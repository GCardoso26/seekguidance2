import type { IncomingMessage, ServerResponse } from "node:http";

export function readUrl(req: IncomingMessage): URL {
  return new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
}

export function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

export async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<string, unknown>;
  } catch {
    throw new Error("invalid_json");
  }
}

export function str(body: Record<string, unknown>, key: string): string | undefined {
  const v = body[key];
  return typeof v === "string" ? v : undefined;
}

export function num(body: Record<string, unknown>, key: string): number | undefined {
  const v = body[key];
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}
