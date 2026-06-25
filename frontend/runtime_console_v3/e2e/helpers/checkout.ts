import { hasAuthEnv } from "./supabase-auth";
import { createSupabaseServiceClient } from "./supabase-client";

const RACE_PRODUCT_NAME = "E2E Race Test Product";

function getTcgJudgeAdmin() {
  if (!hasAuthEnv()) return null;
  return createSupabaseServiceClient("tcg_judge");
}

export async function getOrCreateRaceProduct(): Promise<string | null> {
  const admin = getTcgJudgeAdmin();
  if (!admin) return null;

  const { data: existing } = await admin
    .from("store_products")
    .select("id")
    .eq("name", RACE_PRODUCT_NAME)
    .maybeSingle();

  if (existing?.id) return existing.id as string;

  const { data: store } = await admin
    .from("stores")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (!store?.id) return null;

  const { data: created, error } = await admin
    .from("store_products")
    .insert({
      store_id: store.id,
      name: RACE_PRODUCT_NAME,
      description: "Produto efêmero para testes E2E de concorrência",
      category: "accessory",
      price_cents: 100,
      stock: 1,
      reserved_stock: 0,
      is_active: true,
    })
    .select("id")
    .single();

  if (error || !created?.id) return null;
  return created.id as string;
}

export async function setupSingleStockItem(productId: string) {
  const admin = getTcgJudgeAdmin();
  if (!admin) throw new Error("Missing Supabase admin credentials");

  await admin
    .from("store_products")
    .update({ stock: 1, reserved_stock: 0 })
    .eq("id", productId);

  await admin
    .from("checkout_sessions")
    .update({ status: "cancelled" })
    .eq("status", "active");
}

export async function getStockQuantity(productId: string): Promise<number | null> {
  const admin = getTcgJudgeAdmin();
  if (!admin) return null;

  const { data } = await admin
    .from("store_products")
    .select("stock, reserved_stock")
    .eq("id", productId)
    .single();

  if (!data) return null;
  const stock = Number(data.stock ?? 0);
  const reserved = Number(data.reserved_stock ?? 0);
  return stock - reserved;
}

export async function clearUserCart(baseURL: string, storageStatePath: string) {
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch();
  const context = await browser.newContext({ storageState: storageStatePath });
  const page = await context.newPage();

  await page.request.delete(`${baseURL}/api/marketplace/shop/cart`).catch(() => undefined);
  await page.request.post(`${baseURL}/api/marketplace/shop/cart`, {
    data: { clear: true },
  }).catch(() => undefined);

  await context.close();
  await browser.close();
}

export async function addProductToUserCart(
  baseURL: string,
  storageStatePath: string,
  productId: string,
) {
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch();
  const context = await browser.newContext({ storageState: storageStatePath });
  const request = context.request;

  await request.post(`${baseURL}/api/marketplace/shop/cart`, {
    data: { product_id: productId, quantity: 1 },
  });

  await context.close();
  await browser.close();
}

export async function initiateCheckout(
  baseURL: string,
  storageStatePath: string,
): Promise<{ status: number; body: string }> {
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch();
  const context = await browser.newContext({ storageState: storageStatePath });
  const res = await context.request.post(`${baseURL}/api/marketplace/shop/checkout`, {
    data: {},
  });
  const body = await res.text();
  const status = res.status();
  await context.close();
  await browser.close();
  return { status, body };
}

export function canRunCheckoutRace(): boolean {
  return hasAuthEnv() && Boolean(process.env.API_PROXY_TARGET || process.env.CI);
}
