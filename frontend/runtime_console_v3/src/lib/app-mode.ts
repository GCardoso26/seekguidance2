/**
 * APP_MODE mirror for the Runtime Console.
 * Production is fail-closed: sandbox entitlements never activate in production.
 */

export type AppMode = "production" | "beta" | "sandbox" | "development";

const RAW = (process.env.NEXT_PUBLIC_APP_MODE || "development").toLowerCase().trim();

const ALLOWED: ReadonlySet<string> = new Set([
  "production",
  "beta",
  "sandbox",
  "development",
]);

export const APP_MODE: AppMode = (ALLOWED.has(RAW) ? RAW : "development") as AppMode;

export function isProductionMode(): boolean {
  return APP_MODE === "production";
}

export function isBetaMode(): boolean {
  return APP_MODE === "beta";
}

/** Sandbox or local development — demo entitlements may apply. */
export function isSandboxMode(): boolean {
  return APP_MODE === "sandbox" || APP_MODE === "development";
}

export function canElevateSandbox(): boolean {
  return isSandboxMode() && !isProductionMode();
}
