import { getGameConfig } from "../providers/gameConfigRegistry.js";
import { PLANNED_GAME_CODES, PROVIDER_CERTIFICATION_PROFILES } from "./providerCertificationProfile.js";

export type ReadinessMatrixRow = {
  gameCode: string;
  displayName: string;
  releaseTier: string;
  providerStatus: string;
  certification: string;
  northStar: "PASS" | "FAIL" | "N/A";
  beachhead: "YES" | "NO" | "N/A";
  expand: "YES" | "NO" | "PENDING";
};

export type ReadinessMatrix = {
  generatedAt: string;
  rows: ReadinessMatrixRow[];
};

export function buildReadinessMatrix(): ReadinessMatrix {
  const rows: ReadinessMatrixRow[] = [];

  for (const p of PROVIDER_CERTIFICATION_PROFILES) {
    const cfg = getGameConfig(p.gameCode);
    const tier = cfg?.market.releaseTier ?? "?";
    rows.push({
      gameCode: p.gameCode,
      displayName: p.displayName,
      releaseTier: tier,
      providerStatus: p.rolloutMode,
      certification: p.certification,
      northStar: p.gameCode === "LORCANA" && p.certification === "PASS" ? "PASS" : p.gameCode === "LORCANA" ? "FAIL" : "N/A",
      beachhead: p.lifecycle === "beachhead" ? "YES" : p.gameCode === "LORCANA" ? "NO" : "N/A",
      expand:
        p.certification === "PASS" || p.lifecycle === "shadow" || p.lifecycle === "implemented"
          ? p.certification === "FAIL"
            ? "PENDING"
            : "YES"
          : "NO",
    });
  }

  for (const planned of PLANNED_GAME_CODES) {
    rows.push({
      gameCode: planned.gameCode,
      displayName: planned.displayName,
      releaseTier: planned.releaseTier,
      providerStatus: "OFF",
      certification: "N/A",
      northStar: "N/A",
      beachhead: "N/A",
      expand: "NO",
    });
  }

  return { generatedAt: new Date().toISOString(), rows };
}

export function formatReadinessMatrixMarkdown(matrix: ReadinessMatrix): string {
  const lines = [
    "# Readiness Matrix",
    "",
    `_Gerado em ${matrix.generatedAt}_`,
    "",
    "| Game | Provider | Certification | North Star | Beachhead | Expand |",
    "| --- | --- | --- | --- | --- | --- |",
  ];
  for (const r of matrix.rows) {
    lines.push(
      `| ${r.displayName} | ${r.providerStatus} | ${r.certification} | ${r.northStar} | ${r.beachhead} | ${r.expand} |`,
    );
  }
  return lines.join("\n");
}
