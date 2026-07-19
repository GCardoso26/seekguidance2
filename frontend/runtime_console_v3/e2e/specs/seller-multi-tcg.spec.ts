import fs from "fs";
import path from "path";
import { test, expect } from "@playwright/test";
import {
  getLifecycleSharedState,
  installLifecycleMocks,
  resetLifecycleSharedState,
} from "../helpers/lifecycle-mocks";
import { waitForSellerPanelReady } from "../helpers/wait-panel";

const AUTH = path.join(__dirname, "../.auth/seller.json");
const MANIFEST = path.join(__dirname, "../.seed/run.json");

/** Jogos da wave + SWU (fora da wave → desabilitado). */
const GAMES: Array<{ label: RegExp; slug: string; enabled: boolean; query: string; sample: RegExp }> = [
  { label: /^lorcana$/i, slug: "lorcana", enabled: true, query: "Elsa", sample: /elsa/i },
  { label: /^magic$/i, slug: "mtg", enabled: true, query: "Lightning", sample: /lightning/i },
  { label: /^pokemon$/i, slug: "pokemon", enabled: true, query: "Pika", sample: /pikachu/i },
  { label: /^one piece$/i, slug: "onepiece", enabled: true, query: "Luffy", sample: /luffy/i },
  { label: /^digimon$/i, slug: "digimon", enabled: true, query: "Agumon", sample: /agumon/i },
  { label: /star wars/i, slug: "swu", enabled: false, query: "", sample: /./ },
];

test.describe("Multi-TCG catálogo", () => {
  test.use({ storageState: AUTH });

  test.beforeAll(() => {
    resetLifecycleSharedState();
    if (fs.existsSync(MANIFEST)) getLifecycleSharedState();
  });

  test.beforeEach(async ({ page }, testInfo) => {
    if (!fs.existsSync(AUTH) || !fs.existsSync(MANIFEST)) {
      testInfo.skip(true, "seed:test + auth setup necessários");
      return;
    }
    await installLifecycleMocks(page);
  });

  for (const game of GAMES) {
    test(`${game.slug}: aba ${game.enabled ? "habilitada" : "desabilitada"}`, async ({ page }) => {
      await page.goto("/vendedor/painel/catalogo/cartas");
      await waitForSellerPanelReady(page);
      const tab = page.getByRole("button", { name: game.label });
      await expect(tab).toBeVisible({ timeout: 20_000 });
      if (!game.enabled) {
        await expect(tab).toBeDisabled();
        return;
      }
      await tab.click();
      await page.getByTestId("search-card").fill(game.query);
      await expect(page.getByText(game.sample).first()).toBeVisible({ timeout: 15_000 });
    });
  }
});
