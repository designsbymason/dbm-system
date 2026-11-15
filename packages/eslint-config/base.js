import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

/** Shared base ESLint flat config for non-React DBM System packages. */
export const base = tseslint.config(
  {
    // `storybook-static/**` added alongside the new `build-storybook` CI
    // step (see .github/workflows/ci.yml) — Storybook's static build output
    // is gitignored but wasn't previously excluded from lint, so a local
    // `pnpm build-storybook` followed by `pnpm lint` fed thousands of lines
    // of minified/bundled JS into ESLint (confirmed: 21,000+ bogus errors).
    ignores: ["dist/**", "coverage/**", ".turbo/**", "node_modules/**", "storybook-static/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // The packages take no animation library: they animate with CSS and the motion tokens (ADR-0140). The docs site
    // may add Motion for an interaction CSS can't do and never GSAP (ADR-0212); neither may reach a published package.
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["gsap", "gsap/*", "motion", "motion/*", "framer-motion", "framer-motion/*", "popmotion", "animejs", "react-spring", "@react-spring/*", "lottie-web", "lottie-react"],
              message: "The packages take no animation library: animate with CSS and the motion tokens (ADR-0140, ADR-0212).",
            },
          ],
        },
      ],
    },
  },
  eslintConfigPrettier,
);

export default base;
