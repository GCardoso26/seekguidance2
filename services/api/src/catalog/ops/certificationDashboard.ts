import {
  PLANNED_GAME_CODES,
  PROVIDER_CERTIFICATION_PROFILES,
  type ProviderCertificationProfile,
} from "./providerCertificationProfile.js";

export type ProviderCertificationDashboard = {
  generatedAt: string;
  providers: ProviderCertificationProfile[];
};

export function buildProviderCertificationDashboard(): ProviderCertificationDashboard {
  return {
    generatedAt: new Date().toISOString(),
    providers: [...PROVIDER_CERTIFICATION_PROFILES],
  };
}

export function formatProviderCertificationMarkdown(dashboard: ProviderCertificationDashboard): string {
  const lines: string[] = [
    "# Provider Certification Dashboard",
    "",
    `_Gerado em ${dashboard.generatedAt}_`,
    "",
    "> Métricas de engenharia/ops — não substituem LPC/LCS/SD.",
    "",
  ];

  for (const p of dashboard.providers) {
    lines.push(`## ${p.displayName} (${p.gameCode})`);
    lines.push("");
    lines.push(`| Campo | Valor |`);
    lines.push(`| --- | --- |`);
    lines.push(`| Status | ${p.rolloutMode} (${p.lifecycle}) |`);
    lines.push(`| Coverage | ${p.coveragePercent}% |`);
    if (p.cardsSynced > 0) lines.push(`| Cards | ${p.cardsSynced} |`);
    lines.push(`| Images | ${p.imagesPercent}% |`);
    lines.push(`| Variants | ${p.variantsPercent}% |`);
    lines.push(`| Sync | ${p.syncStatus} |`);
    lines.push(`| Search | ${p.searchProjectionStatus} |`);
    lines.push(`| Certification | **${p.certification}** |`);
    lines.push("");
    if (p.pendingChecklist.length) {
      lines.push("### Pendências");
      lines.push("");
      for (const item of p.pendingChecklist) {
        lines.push(`- [ ] ${item}`);
      }
      lines.push("");
    }
  }

  for (const planned of PLANNED_GAME_CODES) {
    lines.push(`## ${planned.displayName} (${planned.gameCode}) — ${planned.releaseTier}`);
    lines.push("");
    lines.push(`Lifecycle: **planned** (sem provider LIVE).`);
    lines.push("");
  }

  return lines.join("\n");
}
