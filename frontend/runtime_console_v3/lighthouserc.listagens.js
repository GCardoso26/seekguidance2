/** @type {import('@lhci/cli').LHCIConfig} */
module.exports = {
  ci: {
    collect: {
      url: ["http://localhost:3000/vendedor/painel/listagens"],
      numberOfRuns: 3,
      settings: {
        preset: "mobile",
        throttling: {
          rttMs: 150,
          throughputKbps: 1638.4,
          cpuSlowdownMultiplier: 4,
        },
      },
      startServerCommand: "npm run start",
      startServerReadyPattern: "Ready",
      startServerReadyTimeout: 120000,
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.5 }],
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.15 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./lighthouse-reports/listagens-baseline",
    },
  },
};
