/** Baseline em produção — rodar localmente: npm run lighthouse:prod */
module.exports = {
  ci: {
    collect: {
      url: [
        "https://judgetcg.com.br/",
        "https://judgetcg.com.br/loja/mtg",
        "https://judgetcg.com.br/decks",
        "https://judgetcg.com.br/entrar",
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
    },
    assert: {
      preset: "lighthouse:recommended",
      assertions: {
        "categories:performance": ["warn", { minScore: 0.85 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["error", { minScore: 0.95 }],
        "categories:seo": ["warn", { minScore: 0.9 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
