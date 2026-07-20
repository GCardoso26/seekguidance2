import { describe, expect, it } from "vitest";
import { buildCapabilityMatrix } from "../../ops/capabilityMatrix.js";
import { buildCardgameReadinessReport } from "../../ops/cardgameReadiness.js";
import { buildOpsReportsBundle } from "../../ops/generateOpsReports.js";
import { PROVIDER_CERTIFICATION_PROFILES } from "../../ops/providerCertificationProfile.js";

import { buildRoadmapRecommendationReport } from "../../ops/roadmapRecommendation.js";
import { buildEcosystemHealthReport } from "../../ops/ecosystemHealth.js";

describe("ops reports", () => {
  it("bundle inclui artefatos R3", () => {
    const bundle = buildOpsReportsBundle();
    expect(bundle.ecosystemHealth.games.length).toBeGreaterThanOrEqual(8);
    expect(bundle.roadmapRecommendation.rankings[0]?.gameCode).toBe("LORCANA");
    expect(bundle.executivePortfolio.games.length).toBe(bundle.roadmapRecommendation.rankings.length);
    expect(bundle.projectStatus.platformStage).toBe("Framework Complete");
  });

  it("Riftbound e Naruto em research", () => {
    const bundle = buildOpsReportsBundle();
    const rift = bundle.projectStatus.providers.find((p) => p.gameCode === "RIFTBOUND");
    const naruto = bundle.projectStatus.providers.find((p) => p.gameCode === "NARUTO");
    expect(rift?.lifecycle).toBe("RESEARCH");
    expect(naruto?.lifecycle).toBe("RESEARCH");
  });

  it("roadmap segue allowlist ADR-013", () => {
    const roadmap = buildRoadmapRecommendationReport();
    const codes = roadmap.rankings.map((r) => r.gameCode);
    expect(codes.indexOf("ONEPIECE")).toBeLessThan(codes.indexOf("DRAGONBALL"));
    expect(codes.indexOf("DRAGONBALL")).toBeLessThan(codes.indexOf("DIGIMON"));
    expect(codes.indexOf("RIFTBOUND")).toBeLessThan(codes.indexOf("NARUTO"));
  });

  it("ecosystem health separa camadas", () => {
    const health = buildEcosystemHealthReport();
    const lor = health.games.find((g) => g.gameCode === "LORCANA");
    expect(lor?.health).toBe("GOOD");
    const mtg = health.games.find((g) => g.gameCode === "MTG");
    expect(mtg?.market).toBe(0);
  });

  it("bundle inclui todos os artefatos", () => {
    const bundle = buildOpsReportsBundle();
    expect(bundle.providerCertificationDashboard.providers.length).toBeGreaterThanOrEqual(3);
    expect(bundle.capabilityMatrix.games).toContain("LORCANA");
    expect(bundle.capabilityMatrix.games).toContain("MTG");
    expect(bundle.readinessMatrix.rows.some((r) => r.gameCode === "LORCANA")).toBe(true);
  });

  it("Lorcana certification PASS", () => {
    const lor = PROVIDER_CERTIFICATION_PROFILES.find((p) => p.gameCode === "LORCANA");
    expect(lor?.certification).toBe("PASS");
    expect(lor?.lifecycle).toBe("beachhead");
  });

  it("MTG certification FAIL com pendências", () => {
    const mtg = PROVIDER_CERTIFICATION_PROFILES.find((p) => p.gameCode === "MTG");
    expect(mtg?.certification).toBe("FAIL");
    expect(mtg?.pendingChecklist.length).toBeGreaterThan(0);
  });

  it("readiness overall calculado", () => {
    const report = buildCardgameReadinessReport();
    const lor = report.games.find((g) => g.gameCode === "LORCANA");
    expect(lor).toBeDefined();
    expect(lor!.overallPercent).toBeGreaterThan(80);
  });

  it("capability matrix inclui ONEPIECE scaffold", () => {
    const m = buildCapabilityMatrix(["ONEPIECE"]);
    expect(m.games).toContain("ONEPIECE");
    const foil = m.rows.find((r) => r.label === "Foil");
    expect(foil?.cells.ONEPIECE).toBe(true);
  });
});
