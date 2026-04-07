import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // WASM/third-party compiled JS files:
    "public/PdfTeXEngine.js",
    "public/swiftlatexpdftex.js",
    "public/latex-worker.js",
    "scripts/**",
  ]),
]);

export default eslintConfig;
