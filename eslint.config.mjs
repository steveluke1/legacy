import js from "@eslint/js";
import nextVitals from "eslint-config-next/core-web-vitals";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      ".git/**",
      ".next/**",
      ".next-e2e/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      "src/**",
      "functions/**",
      "legado antigo/**",
      "index.html",
      "vite.config.js",
      "jsconfig.json",
      "components.json",
      "next-env.d.ts",
    ],
  },
  js.configs.recommended,
  ...nextVitals,
  ...tseslint.configs.recommended,
  {
    files: ["scripts/**/*.{js,mjs,ts}"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: [
      "app/**/*.{ts,tsx}",
      "components/**/*.{ts,tsx}",
      "lib/**/*.{ts,tsx}",
      "server/**/*.{ts,tsx}",
      "tests/**/*.{ts,tsx}",
      "next.config.ts",
      "playwright.config.ts",
      "vitest.config.ts",
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
);
