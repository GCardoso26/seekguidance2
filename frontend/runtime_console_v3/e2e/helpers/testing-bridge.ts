/**
 * Bridge FE E2E → testing/personas (sem alterar domínio de produto).
 * Credenciais determinísticas; nunca cria usuário no teste.
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const here = typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));

function repoRootFrom(base: string) {
  return path.resolve(base, "../../../../");
}

export function assertNotBetaForE2E() {
  const root = repoRootFrom(here);
  const guard = path.join(root, "testing", "guards", "assert-not-beta.mjs");
  const r = spawnSync(process.execPath, [guard, "playwright"], {
    cwd: root,
    env: process.env,
    encoding: "utf8",
  });
  if (r.status !== 0) {
    throw new Error(r.stderr || r.stdout || "E2E blocked: beta/production");
  }
}

export type PersonaAlias = "seller-alpha" | "buyer-alpha" | "collector-alpha";

export function loadTestingPersonaCredentials(alias: PersonaAlias): {
  email: string;
  password: string;
  id: string;
} {
  assertNotBetaForE2E();
  const root = repoRootFrom(here);
  const catalogPath = path.join(root, "testing", "fixtures", "personas-catalog.json");
  if (!fs.existsSync(catalogPath)) {
    spawnSync(process.execPath, [path.join(root, "testing", "seed", "seed-personas.mjs")], {
      cwd: root,
      env: process.env,
    });
  }
  const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8")) as {
    aliases: Record<string, string>;
    credentials: Record<string, { email: string; password: string }>;
  };
  const creds = catalog.credentials[alias];
  if (!creds) throw new Error(`Unknown persona alias: ${alias}`);
  return { ...creds, id: catalog.aliases[alias] };
}

/** Mapeia aliases → storageState files legados (migração gradual). */
export const PERSONA_STORAGE_STATE: Record<PersonaAlias, string> = {
  "seller-alpha": "seller.json",
  "buyer-alpha": "buyer.json",
  "collector-alpha": "buyer.json",
};
