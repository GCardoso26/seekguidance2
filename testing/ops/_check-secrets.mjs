import fs from "fs";
import path from "path";

function loadEnv(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    out[t.slice(0, i)] = t.slice(i + 1).replace(/^["']|["']$/g, "");
  }
  return out;
}

const apiEnv = loadEnv(path.join("services", "api", ".env"));
const feEnv = loadEnv(path.join("frontend", "runtime_console_v3", ".env.local"));

const apiKeys = [
  "STRIPE_SECRET_KEY",
  "MERCADOPAGO_ACCESS_TOKEN",
  "MELHOR_ENVIO_TOKEN",
  "CHECKOUT_PAYMENT_GATEWAY",
  "CHECKOUT_V2_ENABLED",
];

for (const k of apiKeys) {
  const v = process.env[k] || apiEnv[k];
  console.log(`api.${k}:`, v && v.length > 5 ? `SET (${v.length} chars)` : "MISSING");
}

const feKeys = ["NEXT_PUBLIC_CHECKOUT_V2", "CHECKOUT_V2_API_URL", "API_PROXY_TARGET"];
for (const k of feKeys) {
  const v = process.env[k] || feEnv[k];
  console.log(`fe.${k}:`, v ? `SET (${String(v).slice(0, 50)}...)` : "MISSING");
}
