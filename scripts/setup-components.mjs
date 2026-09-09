/**
 * Installs the component-library source that this repository is not allowed to
 * redistribute.
 *
 * Two of the five libraries do not permit redistributing their source:
 *
 *   React Bits  - MIT + Commons Clause. You may use the components in a
 *                 product, but not "sell, sublicense, or redistribute the
 *                 components themselves - whether alone, in a bundle, or as a
 *                 ported version".
 *   Aceternity  - its licence prohibits re-distributing "the Item or its
 *                 source files" and creating templates from it.
 *
 * Shipping their files inside a public template repo would be exactly that, so
 * they are git-ignored and fetched from the libraries' own registries here.
 *
 * Cult UI, Magic UI, Kokonut UI and the shadcn primitives are plain MIT, which
 * explicitly permits redistribution with the notice attached, so those stay
 * committed and pinned - the template cannot break when an upstream component
 * changes shape.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

// shadcn is a direct dependency, so prefer the installed binary: it keeps the
// version reproducible and avoids npx re-downloading the CLI on every build.
const LOCAL_CLI = "node_modules/.bin/shadcn";

const REQUIRED = [
  { file: "components/Threads.tsx", id: "@react-bits/Threads-TS-TW" },
  { file: "components/BlurText.tsx", id: "@react-bits/BlurText-TS-TW" },
  { file: "components/ui/3d-card.tsx", id: "@aceternity/3d-card" },
  { file: "components/ui/spotlight.tsx", id: "@aceternity/spotlight" },
];

const missing = REQUIRED.filter((c) => !existsSync(c.file));
if (missing.length === 0) {
  console.log("Registry components already present — nothing to do.");
  process.exit(0);
}

console.log(
  `Fetching ${missing.length} component(s) from their own registries...`,
);
try {
  const args = ["add", "-y", "-o", ...missing.map((c) => c.id)];
  if (existsSync(LOCAL_CLI)) {
    execFileSync(LOCAL_CLI, args, { stdio: "inherit" });
  } else {
    execFileSync("npx", ["--yes", "shadcn@4.21.0", ...args], { stdio: "inherit" });
  }
} catch {
  console.error(
    "\nInstall failed. You can run it by hand:\n" +
      `  npx shadcn@latest add ${REQUIRED.map((c) => c.id).join(" ")}\n` +
      "Registries are already configured in components.json.",
  );
  process.exit(1);
}

const stillMissing = REQUIRED.filter((c) => !existsSync(c.file));
if (stillMissing.length) {
  console.error(
    "Expected files were not created:\n  " +
      stillMissing.map((c) => c.file).join("\n  "),
  );
  process.exit(1);
}
console.log("Done. Registry components installed.");
