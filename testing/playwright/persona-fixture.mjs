/**
 * Fixture Playwright — carrega personas canônicas (seller-alpha / buyer-alpha).
 * Nunca cria usuários em runtime; credenciais vêm do catálogo determinístico.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testingRoot = path.resolve(__dirname, "..");

export function loadPersonasCatalog() {
  const catalogPath = path.join(testingRoot, "fixtures", "personas-catalog.json");
  if (!fs.existsSync(catalogPath)) {
    throw new Error(
      "personas-catalog.json ausente — rode: node testing/seed/seed-personas.mjs",
    );
  }
  return JSON.parse(fs.readFileSync(catalogPath, "utf8"));
}

export function getPersonaCredentials(alias) {
  const catalog = loadPersonasCatalog();
  const creds = catalog.credentials?.[alias];
  if (!creds) {
    throw new Error(`Persona alias desconhecido: ${alias}`);
  }
  return { alias, email: creds.email, password: creds.password, id: catalog.aliases?.[alias] };
}

/** Bootstrap guard — falha em beta/production. */
export function assertPlaywrightAllowed(env = process.env) {
  const guard = path.join(testingRoot, "guards", "assert-not-beta.mjs");
  const r = spawnSync(process.execPath, [guard, "playwright"], {
    env,
    encoding: "utf8",
  });
  if (r.status !== 0) {
    throw new Error(r.stderr || r.stdout || "Playwright blocked by testing guard");
  }
}
