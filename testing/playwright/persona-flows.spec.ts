/**
 * Spec de referência — fluxos seller/buyer/admin usando personas.
 * Roda via: npx playwright test --config=testing/playwright/playwright.personas.config.ts
 * (ou importado pela suíte FE após bridge).
 *
 * IMPORTANTE: não cria usuários; usa seller-alpha / buyer-alpha.
 */
import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import { getPersonaCredentials } from "./persona-fixture.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testingRoot = path.resolve(__dirname, "..");

function guard() {
  const r = spawnSync(
    process.execPath,
    [path.join(testingRoot, "guards", "assert-not-beta.mjs"), "playwright"],
    { encoding: "utf8", env: process.env },
  );
  if (r.status !== 0) {
    throw new Error(r.stderr || r.stdout || "blocked");
  }
}

test.beforeAll(() => {
  guard();
  // Garante catálogo
  spawnSync(process.execPath, [path.join(testingRoot, "seed", "seed-personas.mjs")], {
    encoding: "utf8",
    env: process.env,
  });
});

test.describe("Persona flows (reference)", () => {
  test("seller-alpha credentials are deterministic", () => {
    const seller = getPersonaCredentials("seller-alpha");
    expect(seller.email).toContain("seller-alpha");
    expect(seller.password).toBeTruthy();
  });

  test("buyer-alpha credentials are deterministic", () => {
    const buyer = getPersonaCredentials("buyer-alpha");
    expect(buyer.email).toContain("buyer-alpha");
  });

  test("collector-alpha credentials are deterministic", () => {
    const c = getPersonaCredentials("collector-alpha");
    expect(c.email).toContain("collector-alpha");
  });
});
