import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",

    // Vendored component-library source, installed via each library's
    // documented shadcn registry and deliberately kept byte-for-byte as
    // published. These files carry their authors' lint conventions (ref writes
    // during render in Threads, setState-in-effect in Kokonut's card, `any` in
    // Aceternity's CardItem); linting them would only pressure us to edit
    // source we have committed not to touch. Everything we author is linted.
    "components/ui/**",
    "components/kokonutui/**",
    "components/Threads.tsx",
    "components/BlurText.tsx",
  ]),
]);

export default eslintConfig;
