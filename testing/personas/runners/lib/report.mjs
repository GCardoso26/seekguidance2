import fs from "node:fs";
import path from "node:path";

export function reportsDir(testingRoot) {
  return path.join(testingRoot, "reports");
}

export function writePersonaReport(testingRoot, personaId, report) {
  const dir = reportsDir(testingRoot);
  fs.mkdirSync(dir, { recursive: true });
  const jsonPath = path.join(dir, `persona-${personaId}-latest.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");
  return jsonPath;
}

export function baseUrl() {
  return (process.env.BASE_URL || process.env.SMOKE_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function manualReport(personaId, displayName, role, status, reason, sections = {}) {
  return {
    generatedAt: new Date().toISOString(),
    personaId,
    displayName,
    role,
    status,
    reason,
    automated: false,
    bugs: { p0: [], p1: [], p2: [], p3: [] },
    ...sections,
  };
}
