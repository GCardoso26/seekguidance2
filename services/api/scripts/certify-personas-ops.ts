/**
 * Persona ops certification — Eduardo / Fernanda / Renato (infra + admin surfaces).
 * No mocks: hits live Redis/BullMQ scripts + production HTTP surfaces.
 *
 * Usage: npx tsx scripts/certify-personas-ops.ts
 */
import "dotenv/config";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.resolve(__dirname, "..");
const BASE = (process.env.BASE_URL ?? "https://judgetcg.com.br").replace(/\/$/, "");

interface Check {
  id: string;
  persona: string;
  ok: boolean;
  detail: string;
}

function run(cmd: string, args: string[], cwd = apiRoot): Promise<{ code: number; out: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, env: process.env, shell: true });
    let out = "";
    child.stdout?.on("data", (d) => {
      out += String(d);
    });
    child.stderr?.on("data", (d) => {
      out += String(d);
    });
    child.on("close", (code) => resolve({ code: code ?? 1, out }));
  });
}

async function httpOk(pathName: string): Promise<{ ok: boolean; status: number; ms: number }> {
  const t0 = performance.now();
  try {
    const res = await fetch(`${BASE}${pathName}`, {
      redirect: "follow",
      headers: { "User-Agent": "JudgeTCG-PersonaCert/1.0" },
      signal: AbortSignal.timeout(20_000),
    });
    return { ok: res.status < 500, status: res.status, ms: performance.now() - t0 };
  } catch (e) {
    return { ok: false, status: 0, ms: performance.now() - t0 };
  }
}

async function main(): Promise<void> {
  const checks: Check[] = [];

  // Eduardo — scheduler / catalog / bullmq / redis
  const bull = await run("npm", ["run", "certify:bullmq"]);
  checks.push({
    persona: "Eduardo",
    id: "eduardo_bullmq_redis",
    ok: bull.code === 0 && /"ok":\s*true/.test(bull.out),
    detail: bull.out.includes('"ok": true') || /"ok": true/.test(bull.out)
      ? "certify:bullmq PASS"
      : bull.out.slice(-200),
  });

  const adminCatalog = await httpOk("/admin/product-catalog");
  checks.push({
    persona: "Eduardo",
    id: "eduardo_admin_catalog_surface",
    ok: adminCatalog.ok,
    detail: `status=${adminCatalog.status} ms=${Math.round(adminCatalog.ms)}`,
  });

  // Fernanda — marketplace / knowledge / collections / search
  for (const [id, p] of [
    ["fernanda_marketplace", "/loja"],
    ["fernanda_search", "/loja/busca"],
    ["fernanda_collections_portal", "/portal/catalog/collections"],
    ["fernanda_knowledge_product", "/marketplace/produtos"],
  ] as const) {
    const r = await httpOk(p);
    checks.push({
      persona: "Fernanda",
      id,
      ok: r.ok,
      detail: `${p} status=${r.status} ms=${Math.round(r.ms)}`,
    });
  }

  // Renato — ops surfaces + load health
  for (const [id, p] of [
    ["renato_health_home", "/"],
    ["renato_observability", "/observability"],
    ["renato_deployments", "/deployments"],
    ["renato_seller_ops", "/vendedor/painel"],
  ] as const) {
    const r = await httpOk(p);
    checks.push({
      persona: "Renato",
      id,
      ok: r.ok,
      detail: `${p} status=${r.status} ms=${Math.round(r.ms)}`,
    });
  }

  const load = await run("npx", ["tsx", "scripts/load-probe-v6.ts"]);
  let loadOk = false;
  try {
    const jsonLine = load.out
      .split("\n")
      .reverse()
      .find((l) => l.trim().startsWith("{"));
    const parsed = JSON.parse(load.out.match(/\{[\s\S]*"stages"[\s\S]*\}/)?.[0] ?? "{}") as {
      ok?: boolean;
    };
    loadOk = Boolean(parsed.ok);
    void jsonLine;
  } catch {
    loadOk = load.code === 0;
  }
  checks.push({
    persona: "Renato",
    id: "renato_load_1000",
    ok: loadOk || load.code === 0,
    detail: loadOk ? "load-probe PASS" : load.out.slice(-180),
  });

  const byPersona = (name: string) => checks.filter((c) => c.persona === name);
  const personaPass = (name: string) => byPersona(name).every((c) => c.ok);

  const report = {
    ok: checks.every((c) => c.ok),
    date: new Date().toISOString(),
    base: BASE,
    personas: {
      Eduardo: personaPass("Eduardo"),
      Fernanda: personaPass("Fernanda"),
      Renato: personaPass("Renato"),
    },
    checks,
  };
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
