import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { API_BASE } from "@/lib/stripe/stripe-api-headers";
import { FREE_DAILY_QUESTIONS, FREE_TCG_IDS } from "@/lib/plan-limits/constants";
import { getSubscriptionTier, isUnlimitedTier } from "@/lib/api/subscription-tier";
import type { TcgType } from "@/types/judge";

const COOKIE_NAME = "tcg_daily_q";

type DailyState = { d: string; c: number; k: string };

function signingSecret(): string {
  const dedicated = (process.env.PLAN_LIMIT_SECRET ?? "").trim();
  if (dedicated) return dedicated;
  if (process.env.NODE_ENV === "production") {
    throw new Error("PLAN_LIMIT_SECRET must be set in production");
  }
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "dev-insecure-plan-limit"
  );
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function userKey(userId: string | null, ip: string): string {
  return userId ?? `ip:${ip}`;
}

function signBody(body: string): string {
  return createHmac("sha256", signingSecret()).update(body).digest("base64url").slice(0, 22);
}

function parseCookie(value: string | undefined): DailyState | null {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expected = signBody(body);
  if (sig.length !== expected.length) return null;
  try {
    if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  } catch {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as DailyState;
  } catch {
    return null;
  }
}

function serializeCookie(state: DailyState): string {
  const body = Buffer.from(JSON.stringify(state)).toString("base64url");
  return `${body}.${signBody(body)}`;
}

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function readDailyCount(req: NextRequest, key: string): number {
  const today = todayKey();
  const existing = parseCookie(req.cookies.get(COOKIE_NAME)?.value);
  if (existing && existing.d === today && existing.k === key) return existing.c;
  return 0;
}

export function getDailyUsageFromRequest(req: NextRequest, userId: string | null): number {
  const key = userKey(userId, getClientIp(req));
  return readDailyCount(req, key);
}

export function applyDailyCookie(res: NextResponse, cookieValue: string): void {
  res.cookies.set(COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 48,
  });
}

export type PlanCheckResult =
  | { ok: true; setCookie?: string }
  | { ok: false; response: NextResponse };

export async function checkAndReserveQuestion(
  req: NextRequest,
  tcg: string,
  userId: string | null,
): Promise<PlanCheckResult> {
  const tier = await getSubscriptionTier(userId);
  const unlimited = isUnlimitedTier(tier);

  if (!unlimited) {
    const allowed = await getAllowedTcgsForUser(userId);
    if (!allowed.includes(tcg as TcgType)) {
      return {
        ok: false,
        response: NextResponse.json(
          { detail: "Este TCG está disponível no plano Pro ou não faz parte da sua seleção Free." },
          { status: 403 },
        ),
      };
    }
  }

  if (unlimited) return { ok: true };

  const ip = getClientIp(req);
  const key = userKey(userId, ip);
  const count = readDailyCount(req, key);

  if (count >= FREE_DAILY_QUESTIONS) {
    return {
      ok: false,
      response: NextResponse.json(
        { detail: "Limite diário atingido. Faça upgrade para continuar." },
        { status: 429 },
      ),
    };
  }

  const next = serializeCookie({ d: todayKey(), c: count + 1, k: key });
  return { ok: true, setCookie: next };
}

async function getAllowedTcgsForUser(userId: string | null): Promise<TcgType[]> {
  if (!userId) return FREE_TCG_IDS;
  try {
    const res = await fetch(`${API_BASE}/runtime/judge/players/me`, {
      headers: { "X-Judge-User-Id": userId },
      cache: "no-store",
    });
    if (!res.ok) return FREE_TCG_IDS;
    const data = (await res.json()) as {
      favoriteTcgs?: string[];
      hasCompletedOnboarding?: boolean;
    };
    if (
      data.hasCompletedOnboarding &&
      Array.isArray(data.favoriteTcgs) &&
      data.favoriteTcgs.length > 0
    ) {
      return data.favoriteTcgs as TcgType[];
    }
    if (Array.isArray(data.favoriteTcgs) && data.favoriteTcgs.length >= 5) {
      return data.favoriteTcgs as TcgType[];
    }
    return FREE_TCG_IDS;
  } catch {
    return FREE_TCG_IDS;
  }
}

export async function getDailyLimitInfo(
  req: NextRequest,
  userId: string | null,
): Promise<{ count: number; limit: number | null; unlimited: boolean }> {
  const tier = await getSubscriptionTier(userId);
  const unlimited = isUnlimitedTier(tier);
  if (unlimited) {
    return { count: 0, limit: null, unlimited: true };
  }
  const key = userKey(userId, getClientIp(req));
  return {
    count: readDailyCount(req, key),
    limit: FREE_DAILY_QUESTIONS,
    unlimited: false,
  };
}
