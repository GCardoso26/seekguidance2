/** @type {import('@lhci/cli').LHCIConfig} */
module.exports = {
  ci: {
    collect: {
      url: [
        "http://localhost:3000/",
        "http://localhost:3000/loja/mtg",
        "http://localhost:3000/decks",
        "http://localhost:3000/entrar",
      ],
      numberOfRuns: 3,
      settings: {
        preset: "desktop",
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
      },
      startServerCommand: "npm run start",
      startServerReadyPattern: "Ready",
      startServerReadyTimeout: 120000,
    },
    assert: {
      preset: "lighthouse:recommended",
      assertions: {
        // Baseline produção (jun/2026): home 91, loja/mtg 85, decks 100
        "categories:performance": ["warn", { minScore: 0.85 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["error", { minScore: 0.95 }],
        "categories:seo": ["warn", { minScore: 0.9 }],
        "first-contentful-paint": ["warn", { maxNumericValue: 1800 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 2500 }],
        "total-blocking-time": ["warn", { maxNumericValue: 200 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.05 }],
        "resource-summary:document:size": ["error", { maxNumericValue: 30000 }],
        "resource-summary:script:size": ["warn", { maxNumericValue: 300000 }],
        "resource-summary:image:size": ["warn", { maxNumericValue: 1000000 }],
      },
      budgets: {
        budgetPath: "./budget.json",
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
