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
          rttMs: 0,
          throughputKbps: 0,
          cpuSlowdownMultiplier: 1,
        },
      },
      startServerCommand: "npm run start",
      startServerReadyPattern: "Ready",
      startServerReadyTimeout: 120000,
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.7 }],
        "categories:accessibility": ["error", { minScore: 0.85 }],
        "categories:best-practices": ["warn", { minScore: 0.85 }],
        "categories:seo": ["error", { minScore: 0.9 }],

        "first-contentful-paint": ["warn", { maxNumericValue: 3000 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 4000 }],
        "total-blocking-time": ["warn", { maxNumericValue: 500 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        interactive: ["warn", { maxNumericValue: 5000 }],

        "aria-allowed-attr": ["warn", { minScore: 0 }],
        "color-contrast": ["warn", { minScore: 0 }],

        "errors-in-console": ["warn", { minScore: 0 }],
        "bf-cache": ["warn", { minScore: 0 }],

        "meta-description": ["error", { minScore: 1 }],

        "legacy-javascript": ["warn", { minScore: 0 }],
        "legacy-javascript-insight": ["warn", { minScore: 0 }],
        "unused-css-rules": ["warn", { minScore: 0 }],
        "unused-javascript": ["warn", { minScore: 0 }],
        "render-blocking-resources": ["warn", { minScore: 0 }],
        "network-dependency-tree": ["warn", { minScore: 0 }],
        "network-dependency-tree-insight": ["warn", { minScore: 0 }],
        "dom-size": ["warn", { minScore: 0 }],
        "mainthread-work-breakdown": ["warn", { minScore: 0 }],
        "max-potential-fid": ["warn", { minScore: 0 }],
        "forced-reflow": ["warn", { minScore: 0 }],
        "total-byte-weight": ["warn", { minScore: 0 }],
        "uses-text-compression": ["warn", { minScore: 0 }],

        "resource-summary:document:size": ["error", { maxNumericValue: 50000 }],
        "resource-summary:script:size": ["warn", { maxNumericValue: 400000 }],
        "resource-summary:image:size": ["warn", { maxNumericValue: 5000000 }],
        "resource-summary:font:size": ["warn", { maxNumericValue: 150000 }],
        "resource-summary:total:size": ["warn", { maxNumericValue: 8000000 }],
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
