import type { Page, Response } from "@playwright/test";

/** Metas de produção (pipeline com `next start` / CI=true). */
export const PERF_BUDGETS_PROD = {
  dashboardMs: 2_000,
  searchApiMs: 500,
  productCreateMs: 1_000,
} as const;

/** Teto smoke em `next dev` (compila sob demanda). */
export const PERF_BUDGETS_DEV = {
  dashboardMs: 25_000,
  searchApiMs: 20_000,
  productCreateMs: 8_000,
} as const;

export const PERF_BUDGETS = process.env.CI ? PERF_BUDGETS_PROD : PERF_BUDGETS_DEV;

export async function withApiMetrics(
  page: Page,
  urlIncludes: string,
  action: () => Promise<void>,
): Promise<{ durationMs: number; count: number; responses: Response[] }> {
  const matched: Response[] = [];
  const onResponse = (res: Response) => {
    if (res.url().includes(urlIncludes)) matched.push(res);
  };
  page.on("response", onResponse);
  const t0 = Date.now();
  try {
    await action();
  } finally {
    page.off("response", onResponse);
  }
  return { durationMs: Date.now() - t0, count: matched.length, responses: matched };
}

export async function measureApiRoundTrip(
  page: Page,
  urlIncludes: string,
  trigger: () => Promise<void>,
): Promise<number> {
  const warm = page.waitForResponse(
    (r) => r.url().includes(urlIncludes) && r.request().method() === "GET",
    { timeout: 30_000 },
  ).catch(() => null);
  await trigger();
  await warm;

  const waiter = page.waitForResponse(
    (r) => r.url().includes(urlIncludes) && r.request().method() === "GET",
    { timeout: 20_000 },
  );
  const t0 = Date.now();
  await trigger();
  await waiter;
  return Date.now() - t0;
}

export async function measureDashboardLoad(page: Page): Promise<number> {
  await page.goto("/vendedor/painel");
  await page.getByTestId("dashboard-metrics").waitFor({ state: "visible", timeout: 45_000 });
  await page.goto("/vendedor/painel");
  await page.getByTestId("dashboard-metrics").waitFor({ state: "visible", timeout: 30_000 });
  const t0 = Date.now();
  await page.reload();
  await page.getByTestId("dashboard-metrics").waitFor({ state: "visible", timeout: 20_000 });
  return Date.now() - t0;
}
