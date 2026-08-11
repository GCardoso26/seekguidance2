import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

/** RC3 / RC10 — enforcement de Design System (warn → error em CI futuro). */
const designSystemRules = {
  "no-restricted-syntax": [
    "warn",
    {
      selector: "Literal[value=/text-\\[[0-9]+px\\]/]",
      message: "Use tokens tipográficos (text-caption, text-small, text-body…) em vez de text-[Npx].",
    },
  ],
  "no-restricted-properties": "off",
};

/** Owned copies de React Bits (upstream) — mesmo tratamento de `luxury/`. */
const reactBitsIgnore = "src/components/react-bits/**";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "coverage/**",
      "src/components/luxury/**",
      reactBitsIgnore,
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["src/app/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
    ignores: ["src/components/luxury/**", reactBitsIgnore],
    rules: {
      ...designSystemRules,
      "no-restricted-imports": [
        "warn",
        {
          paths: [],
          patterns: [],
        },
      ],
    },
  },
  {
    files: ["src/app/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
    ignores: ["src/components/luxury/**", reactBitsIgnore, "src/styles/**"],
    rules: {
      "no-warning-comments": "off",
    },
  },
];

export default eslintConfig;
