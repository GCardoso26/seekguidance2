import fs from "fs";
import path from "path";

/** Carrega .env.local / .env.test para Playwright (Node não lê como o Next.js). */
export function loadE2eEnv(appRoot: string) {
  for (const name of [".env.local", ".env.test", ".env"]) {
    const filePath = path.join(appRoot, name);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      if (process.env[key] != null && process.env[key] !== "") continue;
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  }
}
